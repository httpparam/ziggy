import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filename = path.join('/')

  if (!filename) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    // Create Supabase client with service role key
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the public URL from Supabase storage
    const { data: { publicUrl } } = serviceSupabase.storage
      .from('uploads')
      .getPublicUrl(filename)

    // Redirect to the Supabase public URL for better embed support
    // Discord, Slack, and other platforms will embed the image directly from Supabase
    return NextResponse.redirect(publicUrl, 301)
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}
