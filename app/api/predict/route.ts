import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const inputSchema = z.object({
  percentile: z.coerce.number().min(0).max(100),
  category: z.string().trim().default('OPEN'),
  branch: z.string().trim().default('Computer Science & Engineering'),
  exam: z.enum(['JEE', 'CET']).default('JEE'),
  budget: z.coerce.number().min(0).max(100).optional(),
  location: z.string().trim().max(80).optional().default(''),
})

function classify(percentile: number, cutoff: number): 'Safe' | 'Target' | 'Reach' {
  if (percentile >= cutoff + 2.0) return 'Safe'
  if (percentile >= cutoff - 2.0) return 'Target'
  return 'Reach'
}

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Enter a valid percentile and category.' },
        { status: 400 }
      )
    }

    const { percentile, category, branch, exam, budget, location } = parsed.data

    let cutoffs
    try {
      cutoffs = await prisma.cutoff.findMany({
        where: {
          exam,
          category,
          branch: { contains: branch, mode: 'insensitive' },
        },
        include: {
          college: {
            select: {
              id: true,
              name: true,
              location: true,
              fees: true,
              rating: true,
            },
          },
        },
        orderBy: { percentile: 'desc' },
      })
    } catch {
      cutoffs = []
    }

    const matchingColleges = cutoffs
      .filter((c) => {
        if (budget && c.college.fees > budget * 100000) return false
        if (location && !c.college.location.toLowerCase().includes(location.toLowerCase()))
          return false
        return true
      })
      .slice(0, 20)
      .map((c) => ({
        id: c.college.id,
        name: c.college.name,
        location: c.college.location,
        percentile: c.percentile,
        branch: c.branch,
        capRound: c.capRound,
        classification: classify(percentile, c.percentile),
      }))

    const safeCount = matchingColleges.filter((c) => c.classification === 'Safe').length
    const targetCount = matchingColleges.filter((c) => c.classification === 'Target').length
    const reachCount = matchingColleges.filter((c) => c.classification === 'Reach').length

    const score = Math.min(
      95,
      Math.round(
        (safeCount * 3 + targetCount * 2 + reachCount) /
          Math.max(1, matchingColleges.length) *
          50 +
          (budget ? Math.min(20, budget / 5) : 10) +
          (location ? 5 : 0)
      )
    )

    const band =
      score >= 70 ? 'Strong match' : score >= 45 ? 'Worth exploring' : 'Stretch shortlist'

    return NextResponse.json({
      data: {
        score,
        band,
        summary: { safe: safeCount, target: targetCount, reach: reachCount },
        matchingColleges,
        assumptions: [
          `Based on ${exam} ${category} category cutoffs.`,
          `Branch filter: ${branch || 'All branches'}.`,
          `Safe = percentile ≥ cutoff + 2.0, Target = ±2.0%, Reach = below -2.0%.`,
          'This is a directional signal, not an admission guarantee.',
        ],
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'The predictor could not process that request.' },
      { status: 400 }
    )
  }
}
