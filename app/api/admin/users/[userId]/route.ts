import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-guard'
import { NextRequest, NextResponse } from 'next/server'

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

  // Fetch logs for this user ordered by date descending
  const { data: logs, error: logsError } = await adminClient
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (logsError) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({ error: 'No logs found for this user' }, { status: 404 })
  }

  // Fetch user profile if userId looks like a UUID
  let profile = null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(userId)) {
    const { data: profileData } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    profile = profileData ?? null
  }

  // Fallback: pull profile fields from the most recent log
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
    // Merge: fill any missing profile fields from the log
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
