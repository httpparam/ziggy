import { Navbar } from '@/components/Navbar'
import { ImageUpload } from '@/components/ImageUpload'
import { ImageGallery } from '@/components/ImageGallery'
import { getImages } from '@/app/actions/images'
import { UrlShortener } from '@/components/UrlShortener'
import { getShortUrls } from '@/app/actions/urls'

export default async function DashboardPage() {
  const imagesResult = await getImages()
  const urlsResult = await getShortUrls()

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Upload */}
        <div className="mb-12">
          <ImageUpload />
        </div>

        {/* Images Gallery */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">
            Your Images ({imagesResult.images?.length || 0})
          </h2>
          <ImageGallery images={imagesResult.images || []} />
        </div>

        {/* URL Shortener */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            URL Shortener
          </h2>
          <UrlShortener initialUrls={urlsResult} />
        </div>
      </main>
    </div>
  )
}
