import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-guard'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10))
  const search = searchParams.get('search') ?? ''

  // Fetch all logs to compute per-user aggregates (most recent log per user)
  let query = adminClient
    .from('daily_logs')
    .select('user_id, email, age, gender, year_level, field_of_study, date, risk_level')
    .order('date', { ascending: false })

  if (search) {
    query = query.ilike('email', `%${search}%`)
  }

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({ users: [], page: 1, totalPages: 0, totalCount: 0 })
  }

  // Group by user key (user_id or email for null user_id rows)
  const userMap = new Map<string, typeof logs[0]>()
  for (const log of logs) {
    const key = log.user_id ?? `anon:${log.email}`
    if (!userMap.has(key)) {
      userMap.set(key, log) // first entry is most recent (ordered desc)
    }
  }

  const allUsers = Array.from(userMap.values()).map((log) => ({
    userId: log.user_id ?? null,
    email: log.email ?? '',
    age: log.age ?? null,
    gender: log.gender ?? null,
    yearLevel: log.year_level ?? null,
    fieldOfStudy: log.field_of_study ?? null,
    lastLogDate: log.date,
    lastRiskLevel: log.risk_level ?? '',
  }))

  const totalCount = allUsers.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize
  const users = allUsers.slice(start, start + pageSize)

  return NextResponse.json({ users, page, totalPages, totalCount })
}
