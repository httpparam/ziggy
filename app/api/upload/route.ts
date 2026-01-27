import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { compareApiKey } from '@/lib/utils/api-keys'
import { generateStoragePath } from '@/lib/utils/storage'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

export async function POST(request: Request) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('X-Zipline-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    // Find user with this API key
    const supabase = await createClient()
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, api_key')
      .limit(100)

    if (profileError) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }

    // Find matching profile by comparing API keys
    let userId: string | null = null
    for (const profile of profiles) {
      if (profile.api_key && await compareApiKey(apiKey, profile.api_key)) {
        userId = profile.id
        break
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Generate storage path
    const storagePath = generateStoragePath(userId, file.name)

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
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Save to database
    const { error: dbError } = await supabase.from('images').insert({
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      user_id: userId,
    })

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file
      await serviceSupabase.storage.from('uploads').remove([storagePath])
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
    }

    // Return public URL using app domain
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const publicUrl = `${appUrl}/i/${storagePath}`

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
