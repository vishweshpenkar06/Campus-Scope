import { prisma } from '@/lib/prisma'
import { collegeQuerySchema, errorResponse } from '@/lib/validation'
import { logEvent } from '@/lib/telemetry'
import { Prisma } from '@prisma/client'
import { demoColleges } from '@/lib/demo-data'

const PUBLIC_CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }


const PREVIEW = process.env.NODE_ENV !== 'production'

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return PREVIEW ? demoList(request) : errorResponse('The catalog is temporarily unavailable.', 503)
  }
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
              { instituteCode: { contains: q } },
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
            // Real institutes have official cutoff branches; seeded demo rows
            // may only have courses, so accept either.
            AND: [
              {
                OR: [
                  { cutoffs: { some: { branch: { contains: branch, mode: 'insensitive' } } } },
                  { courses: { some: { name: { contains: branch, mode: 'insensitive' } } } },
                ],
              },
            ],
          }
        : {}),
    }

    if (branch) logEvent('search', branch)

    const [total, data] = await Promise.all([
      prisma.college.count({ where }),
      prisma.college.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { cutoffs: { _count: 'desc' } }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { courses: true, reviews: true, cutoffs: true } },
          placements: { orderBy: { year: 'desc' }, take: 1, select: { avgPackage: true, year: true } },
        },
      }),
    ])

    return Response.json(
      {
        data,
        meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      },
      { headers: PUBLIC_CACHE }
    )
  } catch {
    return PREVIEW ? demoList(request) : errorResponse('The catalog is temporarily unavailable.', 503)
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
    if (query.branch && !college.courses?.some((c) => c.name.toLowerCase().includes(query.branch!.toLowerCase()))) return false
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
    { status: 200, headers: PUBLIC_CACHE }
  )
}
