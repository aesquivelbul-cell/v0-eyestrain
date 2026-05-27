import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-guard'
import { recordAdminAuditEvent } from '@/lib/admin-audit'

export async function GET() {
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

  const { data, error } = await adminClient
    .from('admin_users')
    .select('id, user_id, email, role, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch admin users:', error)
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 })
  }

  return NextResponse.json({ adminUsers: data ?? [] })
}

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const userId = body.userId?.trim()
  const email = body.email?.trim().toLowerCase()
  const role = body.role?.trim() || 'admin'

  if (!userId || !email) {
    return NextResponse.json({ error: 'userId and email are required' }, { status: 400 })
  }

  const insertData = {
    user_id: userId,
    email,
    role,
  }

  const { error } = await adminClient
    .from('admin_users')
    .upsert(insertData, { onConflict: 'user_id' })

  if (error) {
    console.error('Failed to upsert admin user:', error)
    return NextResponse.json({ error: 'Failed to save admin user' }, { status: 500 })
  }

  try {
    await recordAdminAuditEvent({
      targetUserId: userId,
      targetEmail: email,
      eventType: 'admin_user_update',
      description: `Admin grant updated for ${email}`,
      eventData: { role },
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
    })
  } catch (auditError) {
    console.error('Admin user audit log failed:', auditError)
  }

  return NextResponse.json({ success: true })
}
