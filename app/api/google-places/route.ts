import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getGooglePlaceData } from '@/lib/google-places'

const querySchema = z.object({
  name: z.string().trim().min(1).max(200),
  location: z.string().trim().min(1).max(100),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      name: searchParams.get('name'),
      location: searchParams.get('location'),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Provide college name and location.' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ data: null, source: 'no-api-key' })
    }

    const data = await getGooglePlaceData(parsed.data.name, parsed.data.location)

    if (!data) {
      return NextResponse.json({ data: null, source: 'not-found' })
    }

    return NextResponse.json({ data, source: 'google-places' })
  } catch {
    return NextResponse.json({ data: null, source: 'error' })
  }
}
