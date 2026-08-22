const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const BASE_URL = 'https://places.googleapis.com/v1'

type GooglePlaceResult = {
  place_id: string
  displayName?: { text: string }
  rating?: number
  userRatingCount?: number
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>
  reviews?: Array<{
    authorAttribution?: { displayName: string; photoUri?: string }
    rating?: number
    text?: { text: string }
    relativePublishTimeDescription?: string
  }>
  formattedAddress?: string
  websiteUri?: string
  internationalPhoneNumber?: string
}

export type GooglePlaceData = {
  placeId: string
  name: string
  rating: number | null
  totalReviews: number
  photos: string[]
  reviews: Array<{
    author: string
    avatar: string | null
    rating: number
    text: string
    time: string
  }>
  address: string | null
  website: string | null
  phone: string | null
}

const cache = new Map<string, { data: GooglePlaceData; timestamp: number }>()
const CACHE_TTL = 48 * 60 * 60 * 1000 // 48 hours

export type NearbyLandmark = { label: string; name: string; address: string | null }

const landmarkCache = new Map<string, { data: NearbyLandmark[]; timestamp: number }>()

// ponytail: three fixed searchText probes instead of full Nearby/Places exploration — cheap and
// covers the landmarks students actually ask about; swap for Places (New) Nearby Search if richer data is needed.
export async function getNearbyLandmarks(location: string): Promise<NearbyLandmark[] | null> {
  if (!API_KEY) return null

  const probes: [string, string][] = [
    ['Railway station', `${location} railway station`],
    ['PG / hostel hub', `paying guest hostel near ${location}`],
    ['Mess / tiffin', 'tiffin mess canteen'],
  ]
  const cached = landmarkCache.get(location)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const results = await Promise.all(
      probes.map(async ([label, query]) => {
        const res = await fetch(`${BASE_URL}/places:searchText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
          },
          body: JSON.stringify({ textQuery: `${query} ${location}`, maxResultCount: 2, languageCode: 'en' }),
        })
        if (!res.ok) return [] as NearbyLandmark[]
        const body = await res.json()
        return ((body.places ?? []) as Array<{ displayName?: { text?: string }; formattedAddress?: string }>).map(
          (p): NearbyLandmark => ({ label, name: p.displayName?.text ?? 'Unknown', address: p.formattedAddress ?? null })
        )
      })
    )
    const landmarks = results.flat()
    landmarkCache.set(location, { data: landmarks, timestamp: Date.now() })
    return landmarks
  } catch {
    return null
  }
}

export async function getGooglePlaceData(
  collegeName: string,
  location: string
): Promise<GooglePlaceData | null> {
  if (!API_KEY) return null

  const cacheKey = `${collegeName}|${location}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const searchText = `${collegeName} ${location} engineering college`

    const searchRes = await fetch(`${BASE_URL}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.photos,places.reviews,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber',
      },
      body: JSON.stringify({
        textQuery: searchText,
        maxResultCount: 1,
        languageCode: 'en',
      }),
    })

    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const place: GooglePlaceResult | undefined = searchData.places?.[0]
    if (!place) return null

    const photos = (place.photos || [])
      .slice(0, 6)
      // ponytail: proxy through our own route so the Google API key is never exposed to browsers
      .map((p) => `/api/google-places/photo?name=${encodeURIComponent(p.name)}`)

    const reviews = (place.reviews || [])
      .slice(0, 10)
      .map((r) => ({
        author: r.authorAttribution?.displayName || 'Anonymous',
        avatar: r.authorAttribution?.photoUri || null,
        rating: r.rating || 0,
        text: r.text?.text || '',
        time: r.relativePublishTimeDescription || '',
      }))

    const result: GooglePlaceData = {
      placeId: place.place_id,
      name: place.displayName?.text || collegeName,
      rating: place.rating ?? null,
      totalReviews: place.userRatingCount ?? 0,
      photos,
      reviews,
      address: place.formattedAddress ?? null,
      website: place.websiteUri ?? null,
      phone: place.internationalPhoneNumber ?? null,
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch {
    return null
  }
}
