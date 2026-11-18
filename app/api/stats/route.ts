import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PUBLIC_CACHE = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'Stats unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const [cutoffs, colleges, sources, years] = await Promise.all([
      prisma.cutoff.count(),
      prisma.college.count({ where: { instituteCode: { not: null } } }),
      prisma.sourceDocument.count(),
      prisma.cutoff.findMany({ distinct: ['year'], select: { year: true } }),
    ])
    return Response.json({ cutoffs, colleges, sources, years: years.length }, { headers: PUBLIC_CACHE })
  } catch {
    return Response.json({ error: 'Stats unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
