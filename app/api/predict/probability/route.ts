import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/validation'
import { bestRoundOutcome, roundChances } from '@/lib/probability'

const inputSchema = z.object({
  percentile: z.coerce.number().min(0).max(100),
  category: z.string().trim().min(1).max(20).default('OPEN'),
  branch: z.string().trim().max(120).optional(),
  exam: z.enum(['JEE', 'CET']).default('JEE'),
  homeUniversity: z.coerce.boolean().default(true),
})

export async function POST(request: Request) {
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
      const chances = roundChances(percentile, r, homeUniversity)
      const best = bestRoundOutcome(chances)
      return {
        collegeId: r.college.id,
        name: r.college.name,
        location: r.college.location,
        branch: r.branch,
        year: r.year,
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
    assumptions: [
      `Logistic model on ${exam} ${category} closing cutoffs (latest recorded year).`,
      homeUniversity
        ? 'Home university quota applied.'
        : `Other-than-home quota: effective percentile reduced by ${3} points.`,
      'Directional estimate from historical trends, not an admission guarantee.',
    ],
  })
}
