'use client'

import { useState, useTransition, useEffect } from 'react'
import { createShortUrl, deleteShortUrl } from '@/app/actions/urls'
import Icon from '@hackclub/icons'

interface ShortUrl {
  id: string
  code: string
  target_url: string
  is_custom: boolean
  created_at: string
}

interface UrlShortenerProps {
  initialUrls: { urls?: ShortUrl[]; error?: string } | null
}

export function UrlShortener({ initialUrls }: UrlShortenerProps) {
  const [urls, setUrls] = useState<ShortUrl[]>(initialUrls?.urls || [])
  const [targetUrl, setTargetUrl] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [appUrl, setAppUrl] = useState('')

  // Set app URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin)
    }
  }, [])

  function getShortUrl(code: string) {
    if (appUrl) {
      return `${appUrl}/s/${code}`
    }
    return `/s/${code}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!targetUrl) {
      setError('Please enter a URL')
      return
    }

    startTransition(async () => {
      const result = await createShortUrl(targetUrl, useCustom ? customCode : undefined)

      if (result.error) {
        setError(result.error)
      } else if (result.code) {
        // Add the new URL to the list immediately
        const newUrl: ShortUrl = {
          id: Date.now().toString(),
          code: result.code,
          target_url: targetUrl,
          is_custom: !!customCode,
          created_at: new Date().toISOString(),
        }
        setUrls([newUrl, ...urls])
        setTargetUrl('')
        setCustomCode('')
        setUseCustom(false)
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this short URL?')) {
      return
    }

    const result = await deleteShortUrl(id)

    if (result.error) {
      setError(result.error)
    } else {
      // Remove the URL from the list immediately
      setUrls(urls.filter(url => url.id !== id))
    }
  }

  function copyUrl(code: string) {
    const url = getShortUrl(code)
    navigator.clipboard.writeText(url)
    alert('Short URL copied to clipboard!')
  }

  return (
    <div className="space-y-8">
      {/* Create Short URL Form */}
      <div className="bg-black border border-zinc-800 rounded-2xl p-6 shadow-xl">
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800/50 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="url" className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Icon glyph="link" size={16} className="text-[#5bc0de]" />
              Target URL
            </label>
            <div className="relative">
              <input
                id="url"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/very/long/url"
                className="w-full px-4 py-3 pl-11 border-2 border-zinc-700 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-500 focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent outline-none transition-all hover:border-zinc-600"
                required
              />
              <Icon glyph="link" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          {/* Custom Code Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#5bc0de]/10 flex items-center justify-center">
                <Icon glyph="edit" size={20} className="text-[#5bc0de]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Custom short code</p>
                <p className="text-xs text-zinc-500">Create a memorable link</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseCustom(!useCustom)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${
                useCustom ? 'bg-[#5bc0de]' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out ${
                  useCustom ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Custom Code Input */}
          {useCustom && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label htmlFor="customCode" className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Icon glyph="code" size={16} className="text-[#5bc0de]" />
                Custom Code
              </label>
              <div className="relative">
                <input
                  id="customCode"
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="my-custom-link"
                  pattern="[a-zA-Z0-9-_]{3,20}"
                  className="w-full px-4 py-3 pl-11 border-2 border-zinc-700 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-500 focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent outline-none transition-all font-mono text-sm hover:border-zinc-600"
                  required={useCustom}
                />
                <Icon glyph="code" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Icon glyph="info" size={12} />
                3-20 characters • letters, numbers, hyphens, underscores
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#5bc0de] to-[#4a9dc4] hover:from-[#4a9dc4] hover:to-[#3a8db4] text-white font-bold rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#5bc0de] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5bc0de]/20 hover:shadow-xl hover:shadow-[#5bc0de]/30 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Icon glyph="share" size={18} />
                Shorten URL
              </>
            )}
          </button>
        </form>
      </div>

      {/* Short URLs List */}
      <div className="space-y-3">
        {urls.length === 0 ? (
          <div className="text-center py-12 px-6 bg-black border-2 border-dashed border-zinc-800 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900 flex items-center justify-center">
              <Icon glyph="link" size={32} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No short URLs yet</p>
            <p className="text-sm text-zinc-600 mt-1">Create your first shortened link above</p>
          </div>
        ) : (
          urls.map((url) => (
            <div
              key={url.id}
              className="group bg-black border-2 border-zinc-800 hover:border-[#5bc0de]/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-[#5bc0de]/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <code className="flex-1 text-sm font-mono bg-gradient-to-r from-[#5bc0de]/20 to-[#4a9dc4]/20 border-2 border-[#5bc0de]/30 px-4 py-2.5 rounded-xl text-[#5bc0de] font-semibold">
                        {getShortUrl(url.code)}
                      </code>
                      <button
                        onClick={() => copyUrl(url.code)}
                        className="px-5 py-2.5 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm whitespace-nowrap"
                        title="Copy to clipboard"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 truncate font-mono bg-zinc-900/50 px-4 py-2.5 rounded-xl border border-zinc-800/50">
                    {url.target_url}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-600">
                      {new Date(url.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <button
                      onClick={() => handleDelete(url.id)}
                      className="px-3 py-1.5 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                      title="Delete"
                    >
                      <Icon glyph="delete" size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
