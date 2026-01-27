'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateStoragePath } from '@/lib/utils/storage'
import { revalidatePath } from 'next/cache'

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760')
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

export async function uploadImage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to upload images' }
  }

  const file = formData.get('file') as File

  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Invalid file type. Only images are allowed.' }
  }

  // Generate storage path
  const storagePath = generateStoragePath(user.id, file.name)

  // Upload to Supabase Storage using service role key
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await serviceSupabase.storage
    .from('uploads')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Failed to upload file' }
  }

  // Save to database
  const { error: dbError } = await supabase.from('images').insert({
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage_path: storagePath,
    user_id: user.id,
  })

  if (dbError) {
    console.error('Database error:', dbError)
    // Clean up uploaded file
    await serviceSupabase.storage.from('uploads').remove([storagePath])
    return { error: 'Failed to save file record' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getImages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { images: [] }
  }

  const { data: images, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching images:', error)
    return { images: [] }
  }

  return { images: images || [] }
}

export async function deleteImage(imageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete images' }
  }

  // Get image details
  const { data: image, error: fetchError } = await supabase
    .from('images')
    .select('storage_path, user_id')
    .eq('id', imageId)
    .single()

  if (fetchError || !image) {
    return { error: 'Image not found' }
  }

  // Verify ownership
  if (image.user_id !== user.id) {
    return { error: 'You can only delete your own images' }
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId)

  if (dbError) {
    console.error('Database error:', dbError)
    return { error: 'Failed to delete image record' }
  }

  // Delete from storage
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: storageError } = await serviceSupabase.storage
    .from('uploads')
    .remove([image.storage_path])

  if (storageError) {
    console.error('Storage error:', storageError)
    // Don't fail the operation if storage deletion fails
  }

  revalidatePath('/dashboard')
  return { success: true }
}
