import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { DistanceEstimate } from '@/lib/types'

const querySchema = z.object({
  origin: z.string().trim().min(2).max(120),
  destination: z.string().trim().min(2).max(120),
})

type MatrixResponse = {
  rows?: Array<{ elements?: Array<{ status?: string; distance?: { text: string }; duration?: { text: string } }> }>
}

const cache = new Map<string, { data: DistanceEstimate; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({
    origin: new URL(request.url).searchParams.get('origin'),
    destination: new URL(request.url).searchParams.get('destination'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter your starting point.' }, { status: 400 })
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ data: null, source: 'no-api-key' })
  }

  const key = `${parsed.data.origin}|${parsed.data.destination}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ data: cached.data, source: 'cache' })
  }

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
  url.searchParams.set('origins', parsed.data.origin)
  url.searchParams.set('destinations', parsed.data.destination)
  url.searchParams.set('mode', 'transit')
  url.searchParams.set('alternatives', 'true')
  url.searchParams.set('region', 'in')
  url.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY)

  try {
    const res = await fetch(url)
    const body: MatrixResponse = await res.json()
    const element = body.rows?.[0]?.elements?.[0]
    if (!res.ok || !element || element.status !== 'OK') {
      return NextResponse.json({ data: null, source: 'not-found' })
    }

    const data: DistanceEstimate = {
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      transitText: element.duration?.text ?? null,
      drivingText: null,
      distanceText: element.distance?.text ?? null,
    }

    // one extra call with driving mode; failure just leaves drivingText null
    url.searchParams.set('mode', 'driving')
    url.searchParams.delete('alternatives')
    try {
      const driveRes = await fetch(url)
      const driveBody: MatrixResponse = await driveRes.json()
      data.drivingText = driveBody.rows?.[0]?.elements?.[0]?.duration?.text ?? null
    } catch {}

    cache.set(key, { data, timestamp: Date.now() })
    return NextResponse.json({ data, source: 'google-maps' })
  } catch {
    return NextResponse.json({ data: null, source: 'error' })
  }
}
