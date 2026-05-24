import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Total unique respondents
    const { data: logs } = await adminClient
      .from('daily_logs')
      .select('user_id')

    const uniqueUsers = new Set((logs ?? []).map((l: any) => l.user_id ?? l.email)).size
    const totalLogs = (logs ?? []).length

    // Total predictions made
    const { count: predictionsCount } = await adminClient
      .from('predictions')
      .select('id', { count: 'exact', head: true })

    return NextResponse.json({
      respondents: uniqueUsers,
      logsRecorded: totalLogs,
      predictionsGenerated: predictionsCount ?? 0,
    })
  } catch {
    // Return fallback so the landing page never breaks
    return NextResponse.json({
      respondents: 0,
      logsRecorded: 0,
      predictionsGenerated: 0,
    })
  }
}
