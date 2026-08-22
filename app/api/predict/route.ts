import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { classify, computeScore, dedupeLatestRound } from '@/lib/predict-core'

const inputSchema = z.object({
  percentile: z.coerce.number().min(0).max(100),
  category: z.string().trim().default('OPEN'),
  branch: z.string().trim().default('Computer Science & Engineering'),
  exam: z.enum(['JEE', 'CET']).default('JEE'),
  budget: z.coerce.number().min(0).max(100).optional(),
  location: z.string().trim().max(80).optional().default(''),
})

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid percentile and category.' }, { status: 400 })
  }

  const { percentile, category, branch, exam, budget, location } = parsed.data

  let rows
  try {
    rows = await prisma.cutoff.findMany({
      where: {
        exam,
        category,
        ...(branch ? { branch: { contains: branch, mode: 'insensitive' } } : {}),
      },
      include: {
        college: { select: { id: true, name: true, location: true, fees: true } },
      },
      orderBy: { percentile: 'desc' },
    })
  } catch {
    // DB unreachable is a server fault, not a bad request — surface it instead of faking "no matches"
    return NextResponse.json(
      { error: 'The predictor is unavailable right now. Please try again.' },
      { status: 503 }
    )
  }

  type Row = (typeof rows)[number]
  const filtered = dedupeLatestRound(rows).filter((c) => {
    if (budget && c.college.fees > budget * 100000) return false
    if (location && !c.college.location.toLowerCase().includes(location.toLowerCase())) return false
    return true
  })

  const matchingColleges = filtered
    .slice(0, 20)
    .map((c: Row) => ({
      id: c.college.id,
      name: c.college.name,
      location: c.college.location,
      percentile: c.percentile,
      branch: c.branch,
      capRound: c.capRound,
      classification: classify(percentile, c.percentile),
    }))

  const summary = {
    safe: matchingColleges.filter((c) => c.classification === 'Safe').length,
    target: matchingColleges.filter((c) => c.classification === 'Target').length,
    reach: matchingColleges.filter((c) => c.classification === 'Reach').length,
  }

  const score = computeScore(summary, matchingColleges.length, budget, location)
  const band =
    score >= 70 ? 'Strong match' : score >= 45 ? 'Worth exploring' : 'Stretch shortlist'

  return NextResponse.json({
    data: {
      score,
      band,
      summary,
      matchingColleges,
      assumptions: [
        `Based on ${exam} ${category} category cutoffs.`,
        `Branch filter: ${branch || 'All branches'}.`,
        'Each college shows its latest recorded round closing cutoff.',
        `Safe = percentile ≥ cutoff + 2.0, Target = within ±2.0%, Reach = below cutoff −2.0%.`,
        'This is a directional signal, not an admission guarantee.',
      ],
    },
  })
}
