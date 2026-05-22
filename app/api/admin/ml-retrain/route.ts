import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-guard'
import { NextResponse } from 'next/server'

export async function POST() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'
  const flaskBase = apiUrl.replace(/\/api$/, '')
  const retrainKey = process.env.NEXT_PUBLIC_RETRAIN_KEY ?? ''

  try {
    const response = await fetch(`${flaskBase}/api/ml/retrain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Retrain-Key': retrainKey,
      },
      signal: AbortSignal.timeout(10000),
    })

    const body = await response.json()

    if (!response.ok) {
      return NextResponse.json(body, { status: response.status })
    }

    return NextResponse.json(body)
  } catch {
    return NextResponse.json(
      { error: 'ML backend unavailable' },
      { status: 503 },
    )
  }
}
