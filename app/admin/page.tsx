import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminPanel } from '@/components/AdminPanel'
import UserManagement from '@/components/UserManagement'
import { getUserStats } from '@/app/actions/admin'
import { getInvites } from '@/app/actions/invites'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  // Fetch data server-side for better performance
  const [usersResult, invitesResult] = await Promise.all([
    getUserStats(),
    getInvites()
  ])

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-zinc-400">
            Manage invites and users
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Invite Codes</h2>
            <AdminPanel initialInvites={invitesResult} />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
            <UserManagement initialUsers={usersResult} />
          </section>
        </div>
      </main>
    </div>
  )
}
