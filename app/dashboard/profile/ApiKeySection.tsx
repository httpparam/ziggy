'use client'

import { useState } from 'react'
import { regenerateApiKey } from '@/app/actions/profile'

interface ApiKeySectionProps {
  hasApiKey: boolean
}

export default function ApiKeySection({ hasApiKey }: ApiKeySectionProps) {
  const [showKey, setShowKey] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegenerate() {
    if (!confirm('Are you sure? This will invalidate your existing API key.')) {
      return
    }

    setRegenerating(true)
    setError(null)
    setNewKey(null)

    const result = await regenerateApiKey()

    setRegenerating(false)

    if (result.error) {
      setError(result.error)
    } else if (result.apiKey) {
      setNewKey(result.apiKey)
      setShowKey(true)
    }
  }

  const displayKey = newKey || (hasApiKey ? 'zipl_••••••••••••••••' : null)

  return (
    <div className="bg-black rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            API Key
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Use this key to upload images via the API
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black text-sm font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {regenerating ? 'Regenerating...' : hasApiKey ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {newKey && (
        <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-300 mb-2">
            ⚠️ Save this API key now! You won&apos;t be able to see it again.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {displayKey ? (
        <div className="space-y-3">
          <div className="relative">
            <code
              className={`block w-full px-4 py-3 bg-zinc-900 rounded-lg text-sm font-mono ${
                showKey ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {showKey ? displayKey : 'zipl_•••••••••••••••••••••'}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-zinc-300"
            >
              {showKey ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {showKey && newKey && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey)
                alert('API key copied to clipboard!')
              }}
              className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition"
            >
              Copy API Key
            </button>
          )}

          <div className="text-xs text-zinc-500 space-y-1">
            <p>Use this key with the upload script or API:</p>
            <code className="block px-2 py-1 bg-zinc-900 rounded">
              ./scripts/upload.sh image.png {displayKey}
            </code>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">
          No API key generated yet. Click &quot;Generate&quot; to create one.
        </p>
      )}
    </div>
  )
}
