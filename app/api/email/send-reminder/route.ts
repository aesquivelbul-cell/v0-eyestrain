import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get user profile for name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', user.id)
      .single()

    // Get latest prediction for risk level
    const { data: prediction } = await supabase
      .from('predictions')
      .select('risk_level')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const riskLabels = ['Low', 'Moderate', 'High', 'Critical']
    const riskLevel = prediction ? (riskLabels[(prediction as any).risk_level] ?? '') : ''

    const flaskBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api').replace(/\/api$/, '')
    const retrainKey = process.env.NEXT_PUBLIC_RETRAIN_KEY ?? ''

    const res = await fetch(`${flaskBase}/api/email/send-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Retrain-Key': retrainKey,
      },
      body: JSON.stringify({
        email: user.email,
        name: profile?.first_name || user.email?.split('@')[0] || 'there',
        riskLevel,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const body = await res.json()
    if (!res.ok) return NextResponse.json(body, { status: res.status })
    return NextResponse.json(body)
  } catch (err) {
    console.error('Email send error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
