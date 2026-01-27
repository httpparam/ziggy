'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'

// Generate 7-8 character invite code
function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = Math.random() > 0.5 ? 7 : 8
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createInvite(maxUses: number = 1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to create invites' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Only admins can create invites' }
  }

  const code = generateInviteCode()

  const { error } = await supabase.from('invites').insert({
    code,
    created_by: user.id,
    max_uses: maxUses,
  })

  if (error) {
    console.error('Error creating invite:', error)
    return { error: 'Failed to create invite' }
  }

  revalidatePath('/admin')
  return { success: true, code }
}

export async function getInvites() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { invites: [] }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { invites: [] }
  }

  const { data: invites, error } = await supabase
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invites:', error)
    return { invites: [] }
  }

  return { invites: invites || [] }
}

export async function deleteInvite(inviteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete invites' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Only admins can delete invites' }
  }

  // Use service role client for admin operations
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await serviceSupabase
    .from('invites')
    .delete()
    .eq('id', inviteId)

  if (error) {
    console.error('Error deleting invite:', error)
    return { error: 'Failed to delete invite' }
  }

  revalidatePath('/admin')
  return { success: true }
}
