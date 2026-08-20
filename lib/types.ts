export type CollegeCard = {
  id: number
  name: string
  location: string
  fees: number
  rating: number
  overview: string
  hostelFees: number
  hostelAvailable: boolean
  facilities: string
  _count?: { courses: number; reviews: number }
}

export type CollegeDetail = CollegeCard & {
  courses: { id: number; name: string; duration: string; fees: number }[]
  placements: { id: number; year: number; avgPackage: number; highestPackage: number; placementRate: number }[]
  reviews: { id: number; author: string; rating: number; comment: string; createdAt: string }[]
  cutoffs: CutoffRecord[]
}

export type CutoffRecord = {
  id: number
  exam: string
  capRound: number
  category: string
  branch: string
  percentile: number
  year: number
}

export type CollegeListResponse = {
  data: CollegeCard[]
  meta: { total: number; page: number; pageSize: number; totalPages: number }
  source?: 'preview-demo'
}

export type CompareResponse = {
  data: CollegeDetail[]
  source?: 'preview-demo'
}

export type OnboardingState = {
  stream: 'engineering' | 'medical' | null
  exam: 'JEE' | 'CET' | null
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

export type PredictorResult = {
  score: number
  band: string
  summary: { safe: number; target: number; reach: number }
  matchingColleges: Array<{
    id: number
    name: string
    location: string
    percentile: number
    branch: string
    capRound: number
    classification: 'Safe' | 'Target' | 'Reach'
  }>
  assumptions: string[]
}
