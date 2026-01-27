'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'

export async function getUserStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Only admins can view user stats' }
  }

  try {
    const { profiles, userStorage, imageCount, userEmails } = await fetchUserStatsData()

    // Combine profiles with their stats and emails
    const usersWithStats = profiles.map(profile => ({
      ...profile,
      email: userEmails[profile.id] || 'No email',
      storageUsed: userStorage[profile.id] || 0,
      imageCount: imageCount[profile.id] || 0,
    }))

    return { users: usersWithStats }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return { error: 'Failed to fetch user statistics' }
  }
}

export async function wipeUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Only admins can wipe users' }
  }

  // Prevent wiping yourself
  if (userId === user.id) {
    return { error: 'Cannot wipe your own account' }
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all images for this user
  const { data: images } = await serviceSupabase
    .from('images')
    .select('storage_path')
    .eq('user_id', userId)

  // Delete files from storage
  if (images && images.length > 0) {
    const storagePaths = images.map(img => img.storage_path)
    await serviceSupabase.storage.from('uploads').remove(storagePaths)
  }

  // Delete user's images from database
  await serviceSupabase.from('images').delete().eq('user_id', userId)

  // Delete user's profile
  await serviceSupabase.from('profiles').delete().eq('id', userId)

  // Delete user's auth account using service role
  await serviceSupabase.auth.admin.deleteUser(userId)

  revalidatePath('/admin')
  return { success: true }
}

// Cached function to fetch user stats data (revalidated on wipe)
const fetchUserStatsData = unstable_cache(
  async () => {
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [profilesResult, imagesResult] = await Promise.all([
      serviceSupabase
        .from('profiles')
        .select('id, is_admin, created_at')
        .order('created_at', { ascending: false }),
      serviceSupabase
        .from('images')
        .select('user_id, file_size')
    ])

    if (profilesResult.error) {
      throw new Error('Failed to fetch profiles')
    }

    const profiles = profilesResult.data

    if (imagesResult.error) {
      throw new Error('Failed to fetch images')
    }

    const images = imagesResult.data

    // Calculate storage per user using plain objects for serialization
    const userStorage: Record<string, number> = {}
    const imageCount: Record<string, number> = {}

    images?.forEach(img => {
      userStorage[img.user_id] = (userStorage[img.user_id] || 0) + img.file_size
      imageCount[img.user_id] = (imageCount[img.user_id] || 0) + 1
    })

    // Get user emails using admin API
    const userEmails: Record<string, string> = {}
    try {
      const { data: authData } = await serviceSupabase.auth.admin.listUsers()
      if (authData?.users) {
        authData.users.forEach(authUser => {
          if (authUser.email && profiles.some(p => p.id === authUser.id)) {
            userEmails[authUser.id] = authUser.email
          }
        })
      }
    } catch (error) {
      console.error('Error fetching user emails:', error)
    }

    return { profiles, userStorage, imageCount, userEmails }
  },
  ['user-stats-data'],
  { revalidate: 30 }
)
