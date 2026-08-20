import { prisma } from '@/lib/prisma'
import { collegeIdSchema, errorResponse } from '@/lib/validation'
import { demoColleges } from '@/lib/demo-data'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params
    const parsedId = collegeIdSchema.safeParse(rawId)
    if (!parsedId.success)
      return errorResponse('Invalid college ID', 400, parsedId.error.flatten())

    const college = await prisma.college.findUnique({
      where: { id: parsedId.data },
      include: {
        courses: { orderBy: { name: 'asc' } },
        placements: { orderBy: { year: 'desc' } },
        reviews: { orderBy: { createdAt: 'desc' } },
        cutoffs: { orderBy: { percentile: 'desc' } },
      },
    })

    if (!college) return errorResponse('College not found', 404)
    return Response.json(college)
  } catch (error) {
    const { id } = await params
    const parsedId = collegeIdSchema.safeParse(id)
    if (!parsedId.success)
      return errorResponse('Invalid college ID', 400, parsedId.error.flatten())
    const college = demoColleges.find((item) => item.id === parsedId.data)
    if (!college) return errorResponse('College not found', 404)
    return Response.json({
      ...college,
      source: 'preview-demo',
      warning: 'Preview dataset; connect Neon to use live records.',
    })
  }
}
