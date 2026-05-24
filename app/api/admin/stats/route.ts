import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-guard'
import { NextResponse } from 'next/server'

export async function GET() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service role client — bypasses RLS
  let adminClient
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { data: logs, error } = await adminClient
    .from('daily_logs')
    .select('user_id, screen_time, risk_level, eye_strain, headaches, blurry_vision, dry_eyes')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({
      totalRespondents: 0,
      riskDistribution: { Low: 0, Moderate: 0, High: 0, Critical: 0 },
      averageScreenTime: 0,
      topSymptoms: [],
    })
  }

  // Total respondents: distinct registered user_ids + survey rows (null user_id)
  const distinctUserIds = new Set(logs.filter((l) => l.user_id).map((l) => l.user_id))
  const surveyRowCount = logs.filter((l) => !l.user_id).length
  const totalRespondents = distinctUserIds.size + surveyRowCount
  const registeredUserCount = distinctUserIds.size
  const surveyRespondentCount = surveyRowCount

  // Risk distribution
  const riskCounts: Record<string, number> = { Low: 0, Moderate: 0, High: 0, Critical: 0 }
  for (const log of logs) {
    const level = log.risk_level as string
    if (level in riskCounts) riskCounts[level]++
  }
  const total = logs.length
  const riskDistribution = {
    Low: Math.round((riskCounts.Low / total) * 1000) / 10,
    Moderate: Math.round((riskCounts.Moderate / total) * 1000) / 10,
    High: Math.round((riskCounts.High / total) * 1000) / 10,
    Critical: Math.round((riskCounts.Critical / total) * 1000) / 10,
  }
  // Ensure sum = 100 by adjusting the largest bucket for rounding drift
  const sum = riskDistribution.Low + riskDistribution.Moderate + riskDistribution.High + riskDistribution.Critical
  const diff = Math.round((100 - sum) * 10) / 10
  if (diff !== 0) {
    const maxKey = Object.entries(riskDistribution).sort((a, b) => b[1] - a[1])[0][0] as keyof typeof riskDistribution
    riskDistribution[maxKey] = Math.round((riskDistribution[maxKey] + diff) * 10) / 10
  }

  // Average screen time
  const screenTimes = logs.map((l) => Number(l.screen_time) || 0)
  const averageScreenTime =
    Math.round((screenTimes.reduce((a, b) => a + b, 0) / screenTimes.length) * 10) / 10

  // Top 2 symptoms
  const symptomFields = ['eye_strain', 'headaches', 'blurry_vision', 'dry_eyes'] as const
  const symptomCounts = symptomFields.map((field) => ({
    symptom: field,
    count: logs.filter((l) => l[field] === 1).length,
  }))
  symptomCounts.sort((a, b) => b.count - a.count)
  const topSymptoms = symptomCounts.slice(0, 2)

  return NextResponse.json({ totalRespondents, registeredUserCount, surveyRespondentCount, riskDistribution, averageScreenTime, topSymptoms })
}
