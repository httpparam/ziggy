'use client'

import { useState, useTransition } from 'react'
import { createInvite, deleteInvite } from '@/app/actions/invites'
import { useRouter } from 'next/navigation'
import Icon from '@hackclub/icons'

interface Invite {
  id: string
  code: string
  is_used: boolean
  max_uses: number
  uses_count: number
  created_at: string
  used_at: string | null
}

interface AdminPanelProps {
  initialInvites: { invites?: Invite[]; error?: string } | null
}

export function AdminPanel({ initialInvites }: AdminPanelProps) {
  const [invites, setInvites] = useState<Invite[]>(initialInvites?.invites || [])
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState<string | null>(null)
  const [maxUses, setMaxUses] = useState<number>(1)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleCreateInvite() {
    setCreating(true)
    setNewCode(null)

    const result = await createInvite(maxUses)

    setCreating(false)

    if (result.error) {
      alert(result.error)
    } else if (result.code) {
      setNewCode(result.code)
      startTransition(() => {
        router.refresh()
      })
    }
  }

  async function handleDeleteInvite(id: string) {
    if (!confirm('Are you sure you want to delete this invite?')) {
      return
    }

    const result = await deleteInvite(id)

    if (result.error) {
      alert(result.error)
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    alert('Invite code copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Invite Codes
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Generate invite codes for new users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value))}
              className="appearance-none px-4 py-2.5 pr-10 bg-zinc-900 border-2 border-zinc-700 hover:border-zinc-600 rounded-xl text-white text-sm font-medium focus:ring-2 focus:ring-[#5bc0de] focus:border-transparent outline-none transition-all cursor-pointer"
            >
              <option value={1}>One-time use</option>
              <option value={5}>5 uses</option>
              <option value={10}>10 uses</option>
              <option value={25}>25 uses</option>
              <option value={100}>Unlimited</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon glyph="dropdown" size={16} className="text-zinc-400" />
            </div>
          </div>
          <button
            onClick={handleCreateInvite}
            disabled={creating}
            className="px-5 py-2.5 bg-gradient-to-r from-[#5bc0de] to-[#4a9dc4] hover:from-[#4a9dc4] hover:to-[#3a8db4] text-white font-bold rounded-xl transition-all duration-200 focus:ring-2 focus:ring-[#5bc0de] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg shadow-[#5bc0de]/20 hover:shadow-xl hover:shadow-[#5bc0de]/30 flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Icon glyph="plus" size={16} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      {newCode && (
        <div className="p-5 bg-gradient-to-r from-[#5bc0de]/20 to-[#4a9dc4]/20 border-2 border-[#5bc0de]/50 rounded-2xl shadow-lg shadow-[#5bc0de]/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#5bc0de]/30 flex items-center justify-center">
              <Icon glyph="code" size={20} className="text-[#5bc0de]" />
            </div>
            <div>
              <p className="text-base font-bold text-white">New invite code created!</p>
              <p className="text-xs text-zinc-400">Share this code with someone you want to invite</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-3 bg-black/80 rounded-xl border-2 border-[#5bc0de]/30 text-base font-mono text-white text-center">
              {newCode}
            </code>
            <button
              onClick={() => copyCode(newCode)}
              className="px-5 py-3 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Icon glyph="clipboard" size={18} />
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="bg-black rounded-lg border border-zinc-800 overflow-hidden">
        {invites.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            No invite codes yet. Generate one to get started.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="p-4 flex items-center justify-between hover:bg-zinc-900 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <code className="text-sm font-mono bg-zinc-800 px-3 py-1 rounded text-white">
                      {invite.code}
                    </code>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        invite.is_used
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-[#5bc0de]/20 text-[#5bc0de]'
                      }`}
                    >
                      {invite.max_uses === 100
                        ? 'Unlimited'
                        : `${invite.uses_count}/${invite.max_uses} uses`
                      }
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Created {new Date(invite.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {invite.used_at && (
                      <span>
                        {' • Last used '}
                        {new Date(invite.used_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCode(invite.code)}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 rounded transition"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleDeleteInvite(invite.id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
