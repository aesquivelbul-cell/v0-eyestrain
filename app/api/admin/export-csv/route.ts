import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-guard'
import { serializeToCSV, DAILY_LOG_COLUMNS } from '@/lib/csv-export'
import { NextResponse } from 'next/server'

export async function GET() {
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

  const { data: logs, error } = await adminClient
    .from('daily_logs')
    .select(DAILY_LOG_COLUMNS.join(', '))
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }

  const csv = serializeToCSV(
    (logs ?? []) as Record<string, unknown>[],
    [...DAILY_LOG_COLUMNS],
  )

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="eyeguard-export.csv"',
    },
  })
}
