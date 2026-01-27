import { ImageCard } from './ImageCard'
import Icon from '@hackclub/icons'

interface Image {
  id: string
  file_name: string
  storage_path: string
  created_at: string
  file_size: number
}

interface ImageGalleryProps {
  images: Image[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon glyph="photo" size={64} className="text-zinc-700 mx-auto" />
        <p className="mt-4 text-lg font-medium text-white">
          No images yet
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          Upload your first image to get started
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          id={image.id}
          fileName={image.file_name}
          storagePath={image.storage_path}
          createdAt={image.created_at}
          fileSize={image.file_size}
        />
      ))}
    </div>
  )
}
