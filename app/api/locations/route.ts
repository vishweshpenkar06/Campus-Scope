import { prisma } from '@/lib/prisma'
import { demoColleges } from '@/lib/demo-data'

const PUBLIC_CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }


const PREVIEW = process.env.NODE_ENV !== 'production'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    if (!PREVIEW) return Response.json({ error: 'Locations are temporarily unavailable.' }, { status: 503 })
    return Response.json({ data: [...new Set(demoColleges.map((college) => college.location))].sort(), source: 'preview-demo' }, { headers: PUBLIC_CACHE })
  }
  try {
    const locations = await prisma.college.findMany({
      distinct: ['location'],
      select: { location: true },
      orderBy: { location: 'asc' },
    })
    return Response.json({ data: locations.map(({ location }) => location) }, { headers: PUBLIC_CACHE })
  } catch {
    if (!PREVIEW) return Response.json({ error: 'Locations are temporarily unavailable.' }, { status: 503 })
    return Response.json({ data: [...new Set(demoColleges.map((college) => college.location))].sort(), source: 'preview-demo' }, { headers: PUBLIC_CACHE })
  }
}
