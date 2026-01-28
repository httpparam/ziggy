'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Generate 5-character alphanumeric code
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate unique code (avoids collisions)
async function generateUniqueCode(): Promise<string> {
  const supabase = await createClient()
  let code: string
  let exists = true

  do {
    code = generateShortCode()
    const { data } = await supabase
      .from('shortened_urls')
      .select('code')
      .eq('code', code)
      .single()
    exists = !!data
  } while (exists)

  return code!
}

export async function createShortUrl(targetUrl: string, customCode?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Validate URL
  try {
    new URL(targetUrl)
  } catch {
    return { error: 'Invalid URL' }
  }

  let code: string

  if (customCode) {
    // Custom code - validate it
    if (customCode.length < 3 || customCode.length > 20) {
      return { error: 'Custom code must be 3-20 characters' }
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(customCode)) {
      return { error: 'Custom code can only contain letters, numbers, hyphens, and underscores' }
    }

    // Check if code is already taken
    const { data: existing } = await supabase
      .from('shortened_urls')
      .select('code')
      .eq('code', customCode)
      .single()

    if (existing) {
      return { error: 'This code is already taken' }
    }

    code = customCode
  } else {
    // Auto-generate code
    code = await generateUniqueCode()
  }

  // Create shortened URL
  const { error } = await supabase
    .from('shortened_urls')
    .insert({
      code,
      target_url: targetUrl,
      user_id: user.id,
      is_custom: !!customCode,
    })

  if (error) {
    console.error('Error creating short URL:', error)
    return { error: 'Failed to create short URL' }
  }

  revalidatePath('/dashboard')
  return { success: true, code }
}

export async function getShortUrls() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { urls: [] }
  }

  const { data: urls, error } = await supabase
    .from('shortened_urls')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching short URLs:', error)
    return { urls: [] }
  }

  return { urls: urls || [] }
}

export async function deleteShortUrl(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const { error } = await supabase
    .from('shortened_urls')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting short URL:', error)
    return { error: 'Failed to delete short URL' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getUrlByCode(code: string) {
  const supabase = await createClient()

  const { data: urlData, error } = await supabase
    .from('shortened_urls')
    .select('target_url')
    .eq('code', code)
    .single()

  if (error || !urlData) {
    return null
  }

  return urlData.target_url
}
