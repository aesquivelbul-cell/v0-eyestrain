import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the service role key.
 *
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS) and has full
 * database access. It must ONLY be imported from server-side API routes
 * (e.g. files under `app/api/`). Never import this from client components,
 * browser code, or any file that could be bundled for the client.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  )
}
