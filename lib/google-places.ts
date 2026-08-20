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
      .map(
        (p) =>
          `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=800&key=${API_KEY}`
      )

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

export function getPhotoUrl(photoName: string, apiKey: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&key=${apiKey}`
}
