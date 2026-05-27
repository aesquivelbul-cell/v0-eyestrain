import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-guard'
import { fetchAdminAuditEvents, recordAdminAuditEvent } from '@/lib/admin-audit'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    if (typeof err.message === 'string') return err.message
    if (typeof err.error === 'string') return err.error
    try {
      return JSON.stringify(err)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = request.nextUrl.searchParams.get('userId') || undefined
  const userEmail = request.nextUrl.searchParams.get('userEmail') || undefined
  const eventType = request.nextUrl.searchParams.get('eventType') || undefined
  const search = request.nextUrl.searchParams.get('search')?.trim() || undefined
  const limit = Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10))

  try {
    const events = await fetchAdminAuditEvents({
      userId,
      userEmail: userEmail ? decodeURIComponent(userEmail) : undefined,
      eventType,
      search,
      limit,
    })

    return NextResponse.json({ events })
  } catch (error) {
    const message = getErrorMessage(error)
    console.error('Audit fetch error:', message, error)
    return NextResponse.json({ error: message || 'Failed to fetch audit events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const eventType = body.eventType?.trim()
  const description = body.description?.trim()
  const targetUserId = body.targetUserId || null
  const targetEmail = body.targetEmail || null
  const eventData = body.eventData || {}

  if (!eventType || !description) {
    return NextResponse.json({ error: 'eventType and description are required' }, { status: 400 })
  }

  try {
    await recordAdminAuditEvent({
      targetUserId,
      targetEmail,
      eventType,
      description,
      eventData,
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = getErrorMessage(error)
    console.error('Audit insert error:', message, error)
    return NextResponse.json({ error: message || 'Failed to record audit event' }, { status: 500 })
  }
}
