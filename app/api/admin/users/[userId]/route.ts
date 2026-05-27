import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-guard'
import { recordAdminAuditEvent } from '@/lib/admin-audit'
import { NextRequest, NextResponse } from 'next/server'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let adminClient
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { userId } = await params
  const isUuid = uuidRegex.test(userId)

  // Fetch logs for this user ordered by date descending.
  // For survey respondents we look up by email when userId isn't a UUID.
  const query = adminClient
    .from('daily_logs')
    .select('*')
    .order('date', { ascending: false })
    .eq(isUuid ? 'user_id' : 'email', decodeURIComponent(userId))

  const { data: logs, error: logsError } = await query

  if (logsError) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({ error: 'No logs found for this user' }, { status: 404 })
  }

  let profile = null
  if (isUuid) {
    const { data: profileData } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    profile = profileData ?? null
  }

  const latestLog = logs[0]
  if (!profile) {
    profile = {
      email: latestLog.email ?? null,
      age: latestLog.age ?? null,
      gender: latestLog.gender ?? null,
      year_level: latestLog.year_level ?? null,
      field_of_study: latestLog.field_of_study ?? null,
    }
  } else {
    profile = {
      ...profile,
      email: profile.email ?? latestLog.email ?? null,
      age: profile.age ?? latestLog.age ?? null,
      gender: profile.gender ?? latestLog.gender ?? null,
      year_level: profile.year_level ?? latestLog.year_level ?? null,
      field_of_study: profile.field_of_study ?? latestLog.field_of_study ?? null,
    }
  }

  return NextResponse.json({ profile, logs })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let adminClient
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { userId } = await params
  if (!uuidRegex.test(userId)) {
    return NextResponse.json({ error: 'Profile updates are only supported for registered users' }, { status: 400 })
  }

  const body = await request.json()
  const profileUpdates = body.profile
  if (!profileUpdates || typeof profileUpdates !== 'object') {
    return NextResponse.json({ error: 'profile data is required' }, { status: 400 })
  }

  const allowedFields = [
    'first_name',
    'last_name',
    'age',
    'gender',
    'year_level',
    'field_of_study',
  ]

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in profileUpdates) {
      updates[field] = profileUpdates[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No editable profile fields were provided' }, { status: 400 })
  }

  let beforeProfile: Record<string, unknown> | null = null
  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from('user_profiles')
    .select(allowedFields.join(','))
    .eq('user_id', userId)
    .single()

  if (!existingProfileError && existingProfile) {
    beforeProfile = existingProfile as Record<string, unknown>
  }

  const { error: updateError } = await adminClient
    .from('user_profiles')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })

  if (updateError) {
    console.error('Profile update error:', updateError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  const afterProfile = beforeProfile ? { ...beforeProfile, ...updates } : updates

  const fieldLabels: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    age: 'Age',
    gender: 'Gender',
    year_level: 'Year Level',
    field_of_study: 'Field of Study',
  }

  const changeSummary = Object.keys(updates)
    .map((field) => {
      const label = fieldLabels[field] ?? field
      const before = beforeProfile?.[field] ?? 'N/A'
      const after = updates[field] ?? 'N/A'
      return `${label}: "${before}" → "${after}"`
    })
    .join(', ')

  // Use the name from BEFORE the edit so the audit log reflects who was changed
  const targetName = [
    beforeProfile?.first_name,
    beforeProfile?.last_name,
  ]
    .filter(Boolean)
    .join(' ')

  const targetLabel = targetName || userId

  try {
    await recordAdminAuditEvent({
      targetUserId: userId,
      targetEmail: null,
      eventType: 'profile_update',
      description: `Admin updated profile for ${targetLabel}: ${changeSummary}`,
      eventData: {
        before: beforeProfile,
        after: afterProfile,
        changedFields: Object.keys(updates),
      },
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
    })
  } catch (auditError) {
    console.error('Audit logging failed:', auditError)
  }

  return NextResponse.json({ success: true })
}
