'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadImage } from '@/app/actions/images'
import { useRouter } from 'next/navigation'
import Icon from '@hackclub/icons'

export function ImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setError(null)
    setUploading(true)

    const file = acceptedFiles[0]
    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadImage(formData)

    setUploading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }, [router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg']
    },
    maxFiles: 1,
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760')
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive
            ? 'border-[#5bc0de] bg-[#5bc0de]/10'
            : 'border-zinc-700 hover:border-zinc-600'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5bc0de]"></div>
              <p className="text-zinc-400">Uploading...</p>
            </>
          ) : (
            <>
              <Icon glyph="share" size={64} className="text-zinc-600" />
              <div>
                <p className="text-lg font-medium text-white">
                  {isDragActive ? 'Drop your image here' : 'Drag & drop an image'}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                JPG, PNG, GIF, WebP, SVG up to 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
          <Icon glyph="forbidden" size={20} className="text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
