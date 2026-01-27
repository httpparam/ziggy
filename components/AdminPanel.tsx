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
          <select
            value={maxUses}
            onChange={(e) => setMaxUses(parseInt(e.target.value))}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#5bc0de] outline-none"
          >
            <option value={1}>One-time use</option>
            <option value={5}>5 uses</option>
            <option value={10}>10 uses</option>
            <option value={25}>25 uses</option>
            <option value={100}>Unlimited</option>
          </select>
          <button
            onClick={handleCreateInvite}
            disabled={creating}
            className="px-4 py-2 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {creating ? 'Creating...' : 'Generate'}
          </button>
        </div>
      </div>

      {newCode && (
        <div className="p-4 bg-[#5bc0de]/20 border border-[#5bc0de]/50 rounded-lg">
          <p className="text-sm font-medium text-white mb-2">
            New invite code created!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-black rounded border border-zinc-700 text-sm font-mono text-white">
              {newCode}
            </code>
            <button
              onClick={() => copyCode(newCode)}
              className="px-3 py-2 bg-[#5bc0de] hover:bg-[#4a9dc4] text-black text-sm font-bold rounded transition"
            >
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
