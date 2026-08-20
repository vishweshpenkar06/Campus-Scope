import { prisma } from '@/lib/prisma'
import { compareIdsSchema, errorResponse } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    const ids = new URL(request.url).searchParams.get('ids')?.split(',') ?? []
    const parsed = compareIdsSchema.safeParse(ids)
    if (!parsed.success) return errorResponse('Choose exactly 2–3 unique college IDs', 400, parsed.error.flatten())
    const colleges = await prisma.college.findMany({ where: { id: { in: parsed.data } }, include: { courses: true, placements: { orderBy: { year: 'desc' }, take: 1 }, reviews: true } })
    const found = new Set(colleges.map((college) => college.id))
    const missing = parsed.data.filter((id) => !found.has(id))
    if (missing.length) return errorResponse('Some colleges were not found', 400, { missingIds: missing })
    return Response.json({ data: parsed.data.map((id) => colleges.find((college) => college.id === id)) })
  } catch { return errorResponse('Unable to compare colleges', 500) }
}
