export type CollegeCard = {
  id: number
  name: string
  location: string
  fees: number
  rating: number
  overview: string
  websiteUrl: string
  admissionUrl: string
  establishedYear: number
  campusSize: string
  accreditation: string
  hostelFees: number
  hostelAvailable: boolean
  facilities: string
  cautionDeposit?: number
  eligibleScholarships?: string
  topRecruiters?: string
  studentFacultyRatio?: string
  nirfRank?: number
  autonomous?: boolean
  ebcConcessionPct?: number
  tfwsConcessionPct?: number
  scStConcessionPct?: number
  minorityConcessionPct?: number
  placements?: { avgPackage: number; year: number }[]
  _count?: { courses: number; reviews: number }
}

export type CollegeDetail = Omit<CollegeCard, 'placements'> & {
  courses: { id: number; name: string; duration: string; fees: number }[]
  placements: { id: number; year: number; avgPackage: number; highestPackage: number; placementRate: number }[]
  reviews: { id: number; author: string; rating: number; comment: string; createdAt: string }[]
  cutoffs: CutoffRecord[]
  capRoundTrends?: CapRoundTrendRecord[]
  seatMatrices?: SeatMatrixRecord[]
  campusInsights?: CampusInsightRecord[]
}

export type ProvenanceFields = {
  sourceUrl?: string | null
  sourceName?: string | null
  sourceDate?: string | null
  verifiedAt?: string | null
  verifiedBy?: string | null
  confidence?: number
}

export type CutoffRecord = ProvenanceFields & {
  id: number
  exam: string
  capRound: number
  category: string
  branch: string
  percentile: number
  year: number
}

export type CapRoundTrendRecord = {
  id: number
  year: number
  exam: string
  category: string
  branch: string
  round1Cutoff: number
  round2Cutoff: number
  round3Cutoff: number
  spotRoundCutoff: number | null
}

export type SeatMatrixRecord = {
  id: number
  branch: string
  totalSeats: number
  openSeats: number
  obcSeats: number
  scSeats: number
  stSeats: number
  tfwsSeats: number
  allIndiaSeats: number
}

export type CampusInsightRecord = {
  id: number
  authorRole: string
  attendanceStrictness: string
  canteenRating: number
  placementSupport: string
  content: string
  createdAt: string
}

export type DeadlineRecord = {
  id: number
  title: string
  description: string
  eventDate: string
  category: string
  officialLink: string
}

export type DistanceEstimate = {
  origin: string
  destination: string
  drivingText: string | null
  transitText: string | null
  distanceText: string | null
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
  percentile: number | null
  category: string
  branch: string
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
    fees: number
    rating: number
    percentile: number
    branch: string
    capRound: number
    classification: 'Safe' | 'Target' | 'Reach'
    sourceName?: string | null
    sourceUrl?: string | null
    sourceDate?: string | null
    verifiedAt?: string | null
    confidence?: number
  }>
  assumptions: string[]
  citations?: Array<{ source: string; url: string | null; date: string | null; verified: boolean; confidence: number }>
}
