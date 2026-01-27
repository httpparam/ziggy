'use client'

import { useState, useTransition } from 'react'
import { wipeUser } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'
import Icon from '@hackclub/icons'

interface User {
  id: string
  email: string
  is_admin: boolean
  storageUsed: number
  imageCount: number
  created_at: string
}

interface UserManagementProps {
  initialUsers: { users?: User[]; error?: string } | null
}

export default function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers?.users || [])
  const [wipingId, setWipingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleWipeUser(userId: string, userEmail: string) {
    if (!confirm(`Are you sure you want to wipe ${userEmail}?\n\nThis will:\n• Delete all their images\n• Delete their profile\n• Delete their account\n\nThis action CANNOT be undone!`)) {
      return
    }

    setWipingId(userId)
    const result = await wipeUser(userId)

    setWipingId(null)

    if (result.error) {
      alert(result.error)
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Calculate totals
  const totalUsers = users.length
  const totalAdmins = users.filter(u => u.is_admin).length
  const totalImages = users.reduce((sum, u) => sum + u.imageCount, 0)
  const totalStorage = users.reduce((sum, u) => sum + u.storageUsed, 0)

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon glyph="profile" size={20} className="text-[#5bc0de]" />
            <p className="text-sm text-zinc-400">Total Users</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalUsers}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon glyph="admin" size={20} className="text-[#5bc0de]" />
            <p className="text-sm text-zinc-400">Admins</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalAdmins}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon glyph="photo" size={20} className="text-[#5bc0de]" />
            <p className="text-sm text-zinc-400">Total Images</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalImages}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon glyph="download" size={20} className="text-[#5bc0de]" />
            <p className="text-sm text-zinc-400">Total Storage</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatBytes(totalStorage)}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-black rounded-lg border border-zinc-800 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    User Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Images
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Storage Used
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-900/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon glyph="email" size={16} className="text-zinc-500" />
                        <span className="text-sm text-white">
                          {user.email.length > 30 ? user.email.slice(0, 30) + '...' : user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_admin ? (
                        <span className="px-2 py-1 bg-[#5bc0de]/20 text-[#5bc0de] text-xs font-medium rounded inline-flex items-center gap-1">
                          <Icon glyph="admin" size={12} />
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs font-medium rounded">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white">{user.imageCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-300">{formatBytes(user.storageUsed)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-400">{formatDate(user.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleWipeUser(user.id, user.email)}
                        disabled={wipingId === user.id || user.is_admin}
                        className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition disabled:opacity-50 disabled:cursor-not-allowed disabled:text-red-900 inline-flex items-center gap-1"
                      >
                        {wipingId === user.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            Wiping...
                          </>
                        ) : (
                          <>
                            <Icon glyph="delete" size={14} />
                            Wipe
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
