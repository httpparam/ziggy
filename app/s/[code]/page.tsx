import { redirect } from 'next/navigation'
import { getUrlByCode } from '@/app/actions/urls'

export default async function ShortCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const targetUrl = await getUrlByCode(code)

  if (!targetUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-zinc-400">This short URL doesn't exist</p>
        </div>
      </div>
    )
  }

  redirect(targetUrl)
}
