import { Navbar } from '@/components/Navbar'
import { getProfile } from '@/app/actions/profile'
import ApiKeySection from './ApiKeySection'

export default async function ProfilePage() {
  const { profile, email } = await getProfile()

  if (!profile || !email) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-zinc-400">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-zinc-400">
            Manage your account and API access
          </p>
        </div>

        <div className="space-y-6">
          {/* Email Display */}
          <div className="bg-black rounded-lg border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Account Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">Email</p>
                <p className="text-white">{email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">Role</p>
                <p className="text-white">
                  {profile.is_admin ? (
                    <span className="px-2 py-1 bg-[#5bc0de]/20 text-[#5bc0de] text-xs font-medium rounded">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs font-medium rounded">
                      User
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">Member Since</p>
                <p className="text-white">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* API Key Section */}
          <ApiKeySection hasApiKey={!!profile.api_key} />
        </div>
      </main>
    </div>
  )
}
