'use server'

import { createClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/utils/api-keys'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null, email: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { profile, email: user.email }
}

export async function regenerateApiKey() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const newApiKey = generateApiKey()
  const hashedKey = await hashApiKey(newApiKey)

  const { error } = await supabase
    .from('profiles')
    .update({ api_key: hashedKey })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating API key:', error)
    return { error: 'Failed to regenerate API key' }
  }

  revalidatePath('/dashboard')
  return { success: true, apiKey: newApiKey }
}
