import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getNearbyLandmarks } from '@/lib/google-places'

const querySchema = z.object({ location: z.string().trim().min(2).max(120) })

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({ location: new URL(request.url).searchParams.get('location') })
  if (!parsed.success) return NextResponse.json({ error: 'Provide a location.' }, { status: 400 })

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ data: [], source: 'no-api-key' })
  }

  const landmarks = await getNearbyLandmarks(parsed.data.location)
  return NextResponse.json({ data: landmarks ?? [], source: landmarks ? 'google-places' : 'error' })
}
