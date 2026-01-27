'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/app/actions/auth'
import Icon from '@hackclub/icons'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        setIsAdmin(profile?.is_admin || false)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setIsAdmin(data?.is_admin || false))
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) {
    return (
      <nav className="bg-black sticky top-0 z-50">
        <div className="relative h-32 px-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="absolute top-4 left-4 p-2 text-zinc-300 hover:text-white transition"
          >
            <Icon glyph="list" size={32} />
          </button>
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-6xl sm:text-7xl font-black text-white">
            Ziggy
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-black sticky top-0 z-50">
      <div className="relative h-32 px-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute top-4 left-4 p-2 text-zinc-300 hover:text-white transition"
        >
          <Icon glyph={menuOpen ? 'view-close' : 'list'} size={32} />
        </button>

        <Link href="/dashboard" className="absolute top-8 left-1/2 -translate-x-1/2 text-6xl sm:text-7xl font-black text-white hover:text-[#5bc0de] transition">
          Ziggy
        </Link>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black z-40">
          {/* Close button */}
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-6 right-4 p-2 text-zinc-300 hover:text-white transition"
          >
            <Icon glyph="view-close" size={40} />
          </button>

          <div className="flex flex-col items-center justify-center min-h-screen gap-8">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-bold text-white hover:text-[#5bc0de] transition flex items-center gap-3"
                >
                  <Icon glyph="home" size={32} />
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="text-3xl font-bold text-white hover:text-[#5bc0de] transition flex items-center gap-3"
                  >
                    <Icon glyph="admin" size={32} />
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-bold text-white hover:text-[#5bc0de] transition flex items-center gap-3"
                >
                  <Icon glyph="profile" size={32} />
                  Profile
                </Link>
                <div className="text-xl text-zinc-500">
                  {user.email}
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-3xl font-bold text-red-400 hover:text-red-300 transition flex items-center gap-3"
                  >
                    <Icon glyph="door-leave" size={32} />
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-bold text-white hover:text-[#5bc0de] transition flex items-center gap-3"
                >
                  <Icon glyph="door-enter" size={32} />
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-bold text-[#5bc0de] hover:text-[#4a9dc4] transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
