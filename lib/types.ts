export type CollegeCard = {
  id: number
  name: string
  location: string
  fees: number
  rating: number
  overview: string
  _count?: { courses: number; reviews: number }
}

export type CollegeDetail = CollegeCard & {
  courses: { id: number; name: string; duration: string; fees: number }[]
  placements: { id: number; year: number; avgPackage: number; highestPackage: number; placementRate: number }[]
  reviews: { id: number; author: string; rating: number; comment: string; createdAt: string }[]
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
