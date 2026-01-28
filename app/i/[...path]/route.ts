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

    // Check if this is a bot/crawler requesting the page (for embeds)
    const userAgent = request.headers.get('user-agent') || ''
    const isBot = /discord|telegram|slack|twitter|facebook|linkedin|whatsapp|preview/i.test(userAgent)

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const imageUrl = `${baseUrl}/i/${filename}`

    // For bots and crawlers, return HTML with OpenGraph tags
    if (isBot) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Image</title>
          <meta property="og:title" content="Image hosted on Ziggy" />
          <meta property="og:type" content="image" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:image:secure_url" content="${imageUrl}" />
          <meta property="og:image:type" content="${contentType}" />
          <meta property="og:image:alt" content="Shared image" />
          <meta property="og:url" content="${imageUrl}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="${imageUrl}" />
          <meta name="twitter:image:alt" content="Shared image" />
          <meta name="twitter:title" content="Image hosted on Ziggy" />
          <meta property="twitter:image:type" content="${contentType}" />
          <link rel="image_src" href="${imageUrl}" />
          <meta name="description" content="Image hosted on Ziggy" />
        </head>
        <body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000;">
          <img src="${imageUrl}" alt="Shared image" style="max-width:100%;max-height:100vh;" />
        </body>
        </html>
      `.trim()

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }

    // For direct browser access, return the image
    return new NextResponse(data, {
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
