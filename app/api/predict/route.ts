import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { classify, computeScore, dedupeLatestRound } from '@/lib/predict-core'
import { citationFor } from '@/lib/data/provenance'
import { allow, clientIp } from '@/lib/rate-limit'

const inputSchema = z.object({
  percentile: z.coerce.number().min(0).max(100),
  category: z.string().trim().default('OPEN'),
  branch: z.string().trim().default('Computer Engineering'),
  exam: z.enum(['JEE', 'CET']).default('CET'),
  budget: z.coerce.number().min(0).max(100).optional(),
  location: z.string().trim().max(80).optional().default(''),
})

export async function POST(request: Request) {
  if (!(await allow(`predict:${clientIp(request)}`, 30))) {
    return NextResponse.json({ error: 'Too many requests — try again in a minute.' }, { status: 429 })
  }
  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid percentile and category.' }, { status: 400 })
  }

  const { percentile, category, branch, exam, budget, location } = parsed.data

  let rows
  try {
    const latest = await prisma.cutoff.aggregate({
      _max: { year: true },
      where: {
        exam,
        category,
        ...(branch ? { branch: { contains: branch, mode: 'insensitive' } } : {}),
      },
    })
    const latestYear = latest._max.year ?? 0
    rows = await prisma.cutoff.findMany({
      where: {
        exam,
        category,
        ...(branch ? { branch: { contains: branch, mode: 'insensitive' } } : {}),
        // Keep the current year and one fallback year; older rows only matter
        // for the trend charts, not the live shortlist.
        year: { gte: Math.max(0, latestYear - 1) },
      },
      include: {
        college: { select: { id: true, name: true, location: true, fees: true, rating: true } },
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

  type Scored = { row: Row; classification: 'Safe' | 'Target' | 'Reach'; distance: number }
  const scored: Scored[] = filtered.map((row) => ({
    row,
    classification: classify(percentile, row.percentile),
    distance: Math.abs(row.percentile - percentile),
  }))
  const take = (bucket: Scored['classification'], limit: number) =>
    scored
      .filter((item) => item.classification === bucket)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

  // A useful shortlist needs a mix, not the 20 hardest cutoffs in the state.
  const selected: Scored[] = []
  for (const bucket of ['Safe', 'Target', 'Reach'] as const) {
    for (const item of take(bucket, bucket === 'Reach' ? 6 : 7)) {
      if (!selected.some((existing) => existing.row.id === item.row.id)) selected.push(item)
    }
  }
  if (selected.length < 20) {
    for (const item of scored.sort((a, b) => a.distance - b.distance)) {
      if (selected.length >= 20) break
      if (!selected.some((existing) => existing.row.id === item.row.id)) selected.push(item)
    }
  }

  const matchingColleges = selected
    .map(({ row: c, classification }) => ({
      id: c.college.id,
      name: c.college.name,
      location: c.college.location,
      fees: c.college.fees,
      rating: c.college.rating,
      percentile: c.percentile,
      branch: c.branch,
      capRound: c.capRound,
      classification,
      sourceName: c.sourceName,
      sourceUrl: c.sourceUrl,
      sourceDate: c.sourceDate,
      verifiedAt: c.verifiedAt,
      confidence: c.confidence,
    }))

  const citations = [
    ...new Map(
      filtered.slice(0, 20).map((row) => {
        const citation = citationFor(row)
        return [`${citation.source}|${citation.url}|${citation.date}`, citation]
      })
    ).values(),
  ]
  const unverified = matchingColleges.filter((c) => !c.verifiedAt || !c.sourceUrl).length

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
      citations,
      assumptions: [
        `Based on ${exam} ${category} category cutoffs.`,
        exam === 'JEE'
          ? 'JEE rows are All-India seats published in the DTE Maharashtra CAP documents.'
          : 'MHT-CET rows include State, Home University, and Other-than-Home levels.',
        `Branch filter: ${branch || 'All branches'}.`,
        'Each college shows its latest recorded round closing cutoff.',
        `${unverified} of ${matchingColleges.length} rows are unverified or legacy data.`,
        `Safe = percentile ≥ cutoff + 2.0, Target = within ±2.0%, Reach = below cutoff −2.0%.`,
        'This is a directional signal, not an admission guarantee.',
      ],
    },
  })
}
