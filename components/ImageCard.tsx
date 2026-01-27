'use client'

import { useState } from 'react'
import { deleteImage } from '@/app/actions/images'
import { useRouter } from 'next/navigation'
import Icon from '@hackclub/icons'

interface ImageCardProps {
  id: string
  fileName: string
  storagePath: string
  createdAt: string
  fileSize: number
}

export function ImageCard({ id, fileName, storagePath, createdAt, fileSize }: ImageCardProps) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const publicUrl = `${appUrl}/i/${storagePath}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    setDeleting(true)
    const result = await deleteImage(id)

    if (result.error) {
      alert(result.error)
      setDeleting(false)
    } else {
      router.refresh()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="group bg-black rounded-lg overflow-hidden border border-zinc-800">
      <div className="relative aspect-square bg-zinc-900">
        <img
          src={publicUrl}
          alt={fileName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 bg-white rounded-lg hover:bg-zinc-200 transition"
            title="Copy link"
            disabled={deleting}
          >
            {copied ? (
              <Icon glyph="copy-check" size={20} className="text-green-600" />
            ) : (
              <Icon glyph="copy" size={20} className="text-zinc-900" />
            )}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white rounded-lg hover:bg-zinc-200 transition"
            title="Open in new tab"
          >
            <Icon glyph="external" size={20} className="text-zinc-900" />
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
            title="Delete image"
          >
            {deleting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon glyph="delete" size={20} className="text-white" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm font-medium text-white truncate" title={fileName}>
          {fileName}
        </p>
        <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
          <span>{formatFileSize(fileSize)}</span>
          <span>{formatDate(createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
