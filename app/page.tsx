import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Icon from '@hackclub/icons'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to dashboard if already logged in
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="text-4xl sm:text-5xl font-black text-white">
              Ziggy
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-300 hover:text-[#5bc0de] transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black text-sm font-bold rounded-lg transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Simple Image Hosting
          </h1>
          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
            Upload, manage, and share your images with ease. Fast, secure, and built for developers.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="px-6 py-3 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black font-bold rounded-lg transition"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:bg-zinc-900 transition"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="w-12 h-12 bg-[#5bc0de]/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Icon glyph="plus-fill" size={24} className="text-[#5bc0de]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Easy Upload
              </h3>
              <p className="text-sm text-zinc-400">
                Drag and drop or use our API to upload images instantly
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="w-12 h-12 bg-[#5bc0de]/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Icon glyph="private-fill" size={24} className="text-[#5bc0de]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Secure Storage
              </h3>
              <p className="text-sm text-zinc-400">
                Your images are safely stored with Supabase infrastructure
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="w-12 h-12 bg-[#5bc0de]/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Icon glyph="code" size={24} className="text-[#5bc0de]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                API Access
              </h3>
              <p className="text-sm text-zinc-400">
                Integrate image uploads into your workflow with our API
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
