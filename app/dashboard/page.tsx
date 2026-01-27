import { Navbar } from '@/components/Navbar'
import { ImageUpload } from '@/components/ImageUpload'
import { ImageGallery } from '@/components/ImageGallery'
import { getImages } from '@/app/actions/images'

export default async function DashboardPage() {
  const { images } = await getImages()

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <ImageUpload />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Your Images ({images.length})
          </h2>
          <ImageGallery images={images} />
        </div>
      </main>
    </div>
  )
}
