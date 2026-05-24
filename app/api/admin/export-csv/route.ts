import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-guard'
import { generateXLSXBuffer, transformLogsForExcel, DAILY_LOG_COLUMNS } from '@/lib/csv-export'
import { NextResponse } from 'next/server'

const READABLE_HEADERS = [
  'Date',
  'Age',
  'Gender',
  'Year Level',
  'Screen Time (hours)',
  'Breaks Taken',
  'Eye Strain',
  'Headaches',
  'Blurry Vision',
  'Dry Eyes',
  'Brightness (%)',
  'Sleep Hours',
  'Risk Level',
  'Email',
  'Field of Study',
  'Submitted At',
]

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

  try {
    const transformedLogs = transformLogsForExcel(
      (logs ?? []) as Record<string, unknown>[],
    )

    const buffer = await generateXLSXBuffer(transformedLogs, READABLE_HEADERS)

    const today = new Date().toISOString().split('T')[0]

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="eyeguard-export-${today}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('XLSX generation error:', err)
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
  }
}
