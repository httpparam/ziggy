'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const inviteCode = formData.get('inviteCode') as string

  // Check if this is the first user (no profiles exist)
  const { data: existingProfiles, error: countError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (countError) {
    return { error: 'Failed to check user status' }
  }

  const isFirstUser = !existingProfiles || existingProfiles.length === 0

  // If not first user, validate invite code
  let invite: any = null
  if (!isFirstUser) {
    if (!inviteCode || inviteCode.trim() === '') {
      return { error: 'Invite code is required' }
    }

    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('code', inviteCode.trim())
      .single()

    if (inviteError || !inviteData) {
      return { error: 'Invalid invite code' }
    }

    // Check if invite has uses remaining
    if (inviteData.uses_count >= inviteData.max_uses) {
      return { error: 'Invite code has been fully used' }
    }

    invite = inviteData
  }

  // Sign up the user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  // If invite was used, increment usage count
  if (!isFirstUser && invite) {
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        uses_count: invite.uses_count + 1,
        used_by: authData.user?.id,
        used_at: new Date().toISOString(),
      })
      .eq('code', inviteCode.trim())

    if (updateError) {
      console.error('Failed to update invite usage:', updateError)
    }
  }

  // Check if email confirmation is required
  if (authData.user && !authData.user.email_confirmed_at) {
    return { message: 'Check your email to confirm your account' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
