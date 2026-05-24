import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-guard'
import { NextResponse } from 'next/server'

export async function GET() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'
  const flaskBase = apiUrl.replace(/\/api$/, '')

  try {
    const response = await fetch(`${flaskBase}/api/ml/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout so the admin UI doesn't hang if Flask is down
      signal: AbortSignal.timeout(5000),
    })

    const body = await response.json()

    if (!response.ok) {
      return NextResponse.json(body, { status: response.status })
    }

    // Map snake_case Flask response to camelCase for the frontend
    return NextResponse.json({
      modelLoaded: body.model_loaded ?? false,
      trainingRows: body.supabase_rows ?? 0,
      newLogsSinceRetrain: body.new_logs_since_retrain ?? 0,
      retrainThreshold: body.retrain_threshold ?? 10,
    })
  } catch {
    return NextResponse.json(
      { error: 'ML backend unavailable', modelLoaded: false },
      { status: 503 },
    )
  }
}
