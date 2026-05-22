import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-guard'
import { AdminLayout } from '@/components/admin-layout'

export const dynamic = 'force-dynamic'

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Authoritative server-side admin guard — runs even if middleware is bypassed
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    redirect('/login')
  }

  if (!user) {
    redirect('/login')
  }

  if (!isAdmin(user)) {
    redirect('/dashboard?error=access_denied')
  }

  return <AdminLayout>{children}</AdminLayout>
}
