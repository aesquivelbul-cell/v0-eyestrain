import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const { data: logs } = await adminClient
      .from('daily_logs')
      .select('screen_time, sleep_hours, brightness')

    if (!logs || logs.length === 0) {
      return NextResponse.json({ avgScreenTime: 0, avgSleepHours: 0, avgBrightness: 0, totalRespondents: 0 })
    }

    const n = logs.length
    const avgScreenTime = parseFloat((logs.reduce((s: number, l: any) => s + (l.screen_time || 0), 0) / n).toFixed(1))
    const avgSleepHours = parseFloat((logs.reduce((s: number, l: any) => s + (l.sleep_hours || 0), 0) / n).toFixed(1))
    const avgBrightness = Math.round(logs.reduce((s: number, l: any) => s + (l.brightness || 0), 0) / n)

    return NextResponse.json({ avgScreenTime, avgSleepHours, avgBrightness, totalRespondents: n })
  } catch {
    return NextResponse.json({ avgScreenTime: 0, avgSleepHours: 0, avgBrightness: 0, totalRespondents: 0 })
  }
}
