import { prisma } from '@/lib/prisma'
import { collegeQuerySchema, errorResponse } from '@/lib/validation'
import { Prisma } from '@prisma/client'
import { demoColleges } from '@/lib/demo-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = collegeQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) return errorResponse('Invalid query parameters', 400, parsed.error.flatten())
    const { q, location, minFee, maxFee, minRating, page, pageSize } = parsed.data
    const where: Prisma.CollegeWhereInput = {
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
      ...(minFee !== undefined || maxFee !== undefined ? { fees: { ...(minFee !== undefined ? { gte: minFee } : {}), ...(maxFee !== undefined ? { lte: maxFee } : {}) } } : {}),
      ...(minRating !== undefined ? { rating: { gte: minRating } } : {}),
    }
    const [total, data] = await Promise.all([
      prisma.college.count({ where }),
      prisma.college.findMany({ where, orderBy: [{ rating: 'desc' }, { name: 'asc' }], skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { courses: true, reviews: true } } } }),
    ])
    return Response.json({ data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } })
  } catch {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase() ?? ''
    const location = searchParams.get('location')?.toLowerCase() ?? ''
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
    const pageSize = 12
    const filtered = demoColleges.filter((college) => (!q || `${college.name} ${college.location}`.toLowerCase().includes(q)) && (!location || college.location.toLowerCase().includes(location)))
    return Response.json({ data: filtered.slice((page - 1) * pageSize, page * pageSize), meta: { total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) }, source: 'preview-demo' }, { status: 200 })
  }
}
