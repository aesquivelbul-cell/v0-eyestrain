import { createAdminClient } from '@/lib/supabase/admin'

export type AuditEventPayload = {
  targetUserId?: string | null
  targetEmail?: string | null
  eventType: string
  description: string
  eventData?: Record<string, unknown>
  actorId?: string | null
  actorEmail?: string | null
}

export async function recordAdminAuditEvent(event: AuditEventPayload) {
  const adminClient = createAdminClient()

  const insertData = {
    user_id: event.targetUserId || null,
    action: event.eventType,
    resource_type: 'admin',
    resource_id: null,
    changes: {
      description: event.description,
      target_email: event.targetEmail ?? null,
      actor_id: event.actorId ?? null,
      actor_email: event.actorEmail ?? null,
      data: event.eventData ?? {},
    },
  }

  const { error } = await adminClient.from('audit_logs').insert([insertData])
  if (error) {
    throw error
  }
}

export type AuditEvent = {
  id: string
  target_user_id: string | null
  target_email: string | null
  event_type: string
  description: string
  event_data: Record<string, unknown> | null
  actor_id: string | null
  actor_email: string | null
  created_at: string
}

export async function fetchAdminAuditEvents(options?: {
  userId?: string
  userEmail?: string
  eventType?: string
  search?: string
  limit?: number
}): Promise<AuditEvent[]> {
  const adminClient = createAdminClient()
  let query = adminClient
    .from('audit_logs')
    .select('id, user_id, action, resource_type, changes, created_at')
    .order('created_at', { ascending: false })

  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options?.userEmail) {
    query = query.contains('changes', { target_email: options.userEmail })
  }

  if (options?.eventType) {
    query = query.eq('action', options.eventType)
  }

  if (options?.search) {
    query = query.or(`changes->>description.ilike.%${options.search}%,changes->>target_email.ilike.%${options.search}%,changes->>actor_email.ilike.%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    target_user_id: row.user_id ?? null,
    target_email: row.changes?.target_email ?? row.changes?.targetEmail ?? null,
    event_type: row.action ?? row.resource_type ?? 'admin_audit',
    description: row.changes?.description ?? row.action ?? '',
    event_data: row.changes?.data ?? null,
    actor_id: row.changes?.actor_id ?? null,
    actor_email: row.changes?.actor_email ?? null,
    created_at: row.created_at,
  }))
}
