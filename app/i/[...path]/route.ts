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

    // Get the file from Supabase storage
    const { data, error } = await serviceSupabase.storage
      .from('uploads')
      .download(filename)

    if (error || !data) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Convert Blob to ArrayBuffer to get raw bytes
    const arrayBuffer = await data.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Get the content type from the file extension
    const ext = filename.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    }
    const contentType = contentTypeMap[ext || ''] || 'image/jpeg'

    // Serve the raw image binary data with correct Content-Type
    // This is required for Discord/Slack to embed images properly
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
