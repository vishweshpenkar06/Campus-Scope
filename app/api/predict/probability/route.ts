import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/validation'
import {
  PROBABILITY_MODEL_VERSION,
  bestRoundOutcome,
  probabilityAssumptions,
  roundChances,
} from '@/lib/probability'
import { allow, clientIp } from '@/lib/rate-limit'
import { citationFor, isVerified } from '@/lib/data/provenance'

export const dynamic = 'force-dynamic'

const inputSchema = z.object({
  percentile: z.coerce.number().min(0).max(100),
  category: z.string().trim().min(1).max(20).default('OPEN'),
  branch: z.string().trim().max(120).optional(),
  exam: z.enum(['JEE', 'CET']).default('JEE'),
  homeUniversity: z.coerce.boolean().default(true),
})

export async function POST(request: Request) {
  // heavy DB query endpoint — keep the free tier friendly
  if (!allow(`probability:${clientIp(request)}`, 30)) {
    return errorResponse('Too many requests — try again in a minute.', 429)
  }
  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Enter a valid percentile and category.', 400, parsed.error.flatten())

  const { percentile, category, branch, exam, homeUniversity } = parsed.data

  let rows
  try {
    rows = await prisma.capRoundTrend.findMany({
      where: {
        exam,
        category,
        ...(branch ? { branch: { contains: branch, mode: 'insensitive' } } : {}),
      },
      orderBy: { year: 'desc' },
      include: { college: { select: { id: true, name: true, location: true } } },
    })
  } catch {
    return errorResponse('The probability engine is unavailable right now. Please try again.', 503)
  }

  const sampleByKey = new Map<string, number>()
  for (const row of rows) {
    const key = `${row.collegeId}|${row.branch}`
    sampleByKey.set(key, (sampleByKey.get(key) ?? 0) + 1)
  }

  // latest year per college+branch only
  const seen = new Set<string>()
  const data = rows
    .filter((r) => {
      const key = `${r.collegeId}|${r.branch}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 30)
    .map((r) => {
      const key = `${r.collegeId}|${r.branch}`
      const sampleSize = sampleByKey.get(key) ?? 1
      const chances = roundChances(percentile, r, homeUniversity)
      const best = bestRoundOutcome(chances)
      return {
        collegeId: r.college.id,
        name: r.college.name,
        location: r.college.location,
        branch: r.branch,
        year: r.year,
        verified: isVerified(r),
        sampleSize,
        citation: citationFor(r),
        rounds: {
          round1: Math.round(chances.round1 * 100),
          round2: Math.round(chances.round2 * 100),
          round3: Math.round(chances.round3 * 100),
          spot: Math.round(chances.spot * 100),
        },
        summary: `${Math.round(best.probability * 100)}% Allotment Chance in ${best.roundLabel}`,
      }
    })

  return Response.json({
    data,
    modelVersion: PROBABILITY_MODEL_VERSION,
    sampleSize: rows.length,
    unverified: data.filter((row) => !row.verified).length,
    assumptions: probabilityAssumptions({
      exam,
      category,
      homeUniversity,
      sampleSize: rows.length,
    }),
  })
}
