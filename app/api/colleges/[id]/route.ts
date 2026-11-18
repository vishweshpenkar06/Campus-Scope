import { prisma } from '@/lib/prisma'
import { collegeIdSchema, errorResponse } from '@/lib/validation'
import { demoColleges } from '@/lib/demo-data'

function previewCollege(rawId: string) {
  if (process.env.NODE_ENV === 'production') return errorResponse('The catalog is temporarily unavailable.', 503)
  const parsedId = collegeIdSchema.safeParse(rawId)
  if (!parsedId.success) return errorResponse('Invalid college ID', 400, parsedId.error.flatten())
  const college = demoColleges.find((item) => item.id === parsedId.data)
  if (!college) return errorResponse('College not found', 404)
  return Response.json(
    { ...college, source: 'preview-demo', warning: 'Preview dataset; connect Neon to use live records.' },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
  )
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.DATABASE_URL) return previewCollege(id)

  const parsedId = collegeIdSchema.safeParse(id)
  if (!parsedId.success) return errorResponse('Invalid college ID', 400, parsedId.error.flatten())

  try {
    const college = await prisma.college.findUnique({
      where: { id: parsedId.data },
      include: {
        courses: { orderBy: { name: 'asc' } },
        placements: { orderBy: { year: 'desc' } },
        reviews: { orderBy: { createdAt: 'desc' } },
        cutoffs: { orderBy: { percentile: 'desc' } },
        capRoundTrends: { orderBy: [{ year: 'desc' }, { branch: 'asc' }] },
        seatMatrices: { orderBy: { branch: 'asc' } },
        campusInsights: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!college) return errorResponse('College not found', 404)
    return Response.json(college, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    })
  } catch {
    return previewCollege(id)
  }
}
