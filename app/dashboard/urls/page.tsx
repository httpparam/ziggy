import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UrlShortener } from '@/components/UrlShortener'
import { getShortUrls } from '@/app/actions/urls'

export default async function UrlsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const urlsResult = await getShortUrls()

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            URL Shortener
          </h1>
          <p className="text-zinc-400">
            Create short links with auto-generated or custom codes
          </p>
        </div>

        <UrlShortener initialUrls={urlsResult} />
      </main>
    </div>
  )
}
