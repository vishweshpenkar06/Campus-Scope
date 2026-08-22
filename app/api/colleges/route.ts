import { prisma } from '@/lib/prisma'
import { collegeQuerySchema, errorResponse } from '@/lib/validation'
import { Prisma } from '@prisma/client'
import { demoColleges } from '@/lib/demo-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = collegeQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success)
      return errorResponse('Invalid query parameters', 400, parsed.error.flatten())

    const { q, location, branch, minFee, maxFee, minRating, page, pageSize } = parsed.data

    const where: Prisma.CollegeWhereInput = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { location: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
      ...(minFee !== undefined || maxFee !== undefined
        ? {
            fees: {
              ...(minFee !== undefined ? { gte: minFee } : {}),
              ...(maxFee !== undefined ? { lte: maxFee } : {}),
            },
          }
        : {}),
      ...(minRating !== undefined ? { rating: { gte: minRating } } : {}),
      ...(branch
        ? {
            courses: {
              some: { name: { contains: branch, mode: 'insensitive' } },
            },
          }
        : {}),
    }

    const [total, data] = await Promise.all([
      prisma.college.count({ where }),
      prisma.college.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { courses: true, reviews: true } },
          placements: { orderBy: { year: 'desc' }, take: 1, select: { avgPackage: true, year: true } },
        },
      }),
    ])

    return Response.json({
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch {
    return Response.json(await demoList(request))
  }
}

// ponytail: mirrors the Prisma filters in plain JS so the preview dataset behaves the same offline
async function demoList(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = Object.fromEntries(searchParams.entries())
  const parsed = collegeQuerySchema.safeParse(raw)
  const query = parsed.success
    ? parsed.data
    : {
        q: (raw.q ?? '').toLowerCase(),
        location: (raw.location ?? '').toLowerCase(),
        minFee: raw.minFee !== undefined ? Number(raw.minFee) : undefined,
        maxFee: raw.maxFee !== undefined ? Number(raw.maxFee) : undefined,
        minRating: raw.minRating !== undefined ? Number(raw.minRating) : undefined,
        branch: raw.branch ?? '',
        page: Math.max(1, Number(raw.page ?? 1) || 1),
        pageSize: 12,
      }

  const filtered = demoColleges.filter((college) => {
    if (query.q && !`${college.name} ${college.location}`.toLowerCase().includes(query.q)) return false
    if (query.location && !college.location.toLowerCase().includes(query.location)) return false
    if (query.minFee !== undefined && college.fees < query.minFee) return false
    if (query.maxFee !== undefined && college.fees > query.maxFee) return false
    if (query.minRating !== undefined && college.rating < query.minRating) return false
    if (query.branch && !college.courses?.some((c) => c.name.toLowerCase().includes(query.branch.toLowerCase()))) return false
    return true
  })

  return Response.json(
    {
      data: filtered.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
      meta: {
        total: filtered.length,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(filtered.length / query.pageSize),
      },
      source: 'preview-demo',
    },
    { status: 200 }
  )
}
