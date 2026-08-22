import { NextResponse } from 'next/server'

// ponytail: no cache of validated names — Google rejects invalid names and we pass the bytes through
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name')
  if (!process.env.GOOGLE_PLACES_API_KEY || !name || !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) {
    return NextResponse.json({ error: 'Photo not available' }, { status: 400 })
  }

  try {
    const upstream = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxHeightPx=800&key=${process.env.GOOGLE_PLACES_API_KEY}`
    )
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Photo not available' }, { status: 404 })
    }
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Photo not available' }, { status: 502 })
  }
}
