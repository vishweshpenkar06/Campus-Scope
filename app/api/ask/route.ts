import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { allow, clientIp } from '@/lib/rate-limit'
import { logEvent } from '@/lib/telemetry'
import { admissionQuerySchema, parseQuery, toDbExam, type AdmissionQuery } from '@/lib/ai/query'
import { classify, dedupeLatestRound } from '@/lib/predict-core'
import { OTHER_THAN_HOME_PENALTY, PROBABILITY_MODEL_VERSION, clearChance } from '@/lib/probability'
import { citationFor, type Citation } from '@/lib/data/provenance'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const inputSchema = z.object({
  query: z.string().trim().min(3).max(500),
  // Optional edited slots. They override the parser but still go through the
  // same deterministic engine; the LLM never gets to compute a number.
  slots: admissionQuerySchema.optional(),
})

const OFFICIAL_CITATIONS: Citation[] = [
  {
    source: 'DTE Maharashtra / CET Cell',
    url: 'https://cetcell.mahacet.org/',
    date: null,
    verified: true,
    confidence: 1,
  },
]

const DISCLAIMER =
  'Directional guidance from recorded cutoff rows, not an admission guarantee. Verify every number on the official CET Cell portal before applying.'

export async function POST(request: Request) {
  if (!allow(`ask:${clientIp(request)}`, 20)) {
    return Response.json({ error: 'Too many questions — try again in a minute.' }, { status: 429 })
  }

  const parsedInput = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsedInput.success) {
    return Response.json({ error: 'Ask a question between 3 and 500 characters.' }, { status: 400 })
  }

  const parsed = parsedInput.data.slots
    ? { query: parsedInput.data.slots, provider: 'edited' as const }
    : await parseQuery(parsedInput.data.query)
  const query = parsed.query
  logEvent('ask', query.intent)

  try {
    const answer = await answerQuery(query)
    return Response.json({
      understood: query,
      provider: parsed.provider,
      modelVersion: PROBABILITY_MODEL_VERSION,
      ...answer,
      disclaimer: DISCLAIMER,
    })
  } catch {
    // Never invent data when the catalog is unreachable. Return a cited,
    // degraded answer instead of a number we cannot source.
    return Response.json({
      understood: query,
      provider: parsed.provider,
      answer:
        'The cutoff catalog is unavailable right now, so I cannot quote a sourced number. Try again shortly or check the official CET Cell portal.',
      results: [],
      citations: OFFICIAL_CITATIONS,
      assumptions: ['No live catalog rows were available for this request.'],
      degraded: true,
      disclaimer: DISCLAIMER,
    })
  }
}

async function answerQuery(query: AdmissionQuery) {
  if (query.intent === 'deadline') return answerDeadlines()
  if (query.intent === 'eligibility') return answerEligibility(query)
  if (query.intent === 'fees') return answerFees(query)
  if (query.intent === 'compare') return answerCompare(query)
  if (query.intent === 'predict' || query.percentile !== undefined) return answerPredict(query)
  return answerUnknown(query)
}

async function answerPredict(query: AdmissionQuery) {
  if (query.percentile === undefined) {
    return {
      answer:
        'I can check Safe / Target / Reach options, but I need your percentile first. Add it like “85.5 percentile, OPEN, Computer Engineering, Pune”.',
      results: [],
      citations: OFFICIAL_CITATIONS,
      assumptions: ['Percentile was not provided, so no cutoff row was scored.'],
    }
  }

  const exam = toDbExam(query.exam)
  const category = query.category ?? 'OPEN'
  const homeUniversity = query.homeUniversity ?? true
  const effective = homeUniversity ? query.percentile : query.percentile - OTHER_THAN_HOME_PENALTY

  const rows = await prisma.cutoff.findMany({
    where: {
      exam,
      category,
      ...(query.branch ? { branch: { contains: query.branch, mode: 'insensitive' } } : {}),
    },
    include: {
      college: { select: { id: true, name: true, location: true, fees: true } },
    },
    orderBy: { percentile: 'desc' },
    take: 400,
  })

  const filtered = dedupeLatestRound(rows).filter((row) => {
    if (query.budget && row.college.fees > query.budget) return false
    if (query.city && !row.college.location.toLowerCase().includes(query.city.toLowerCase())) return false
    return true
  })

  const results = filtered
    .map((row) => {
      const chance = clearChance(effective, row.percentile)
      return {
        collegeId: row.college.id,
        college: row.college.name,
        location: row.college.location,
        branch: row.branch,
        cutoff: row.percentile,
        year: row.year,
        capRound: row.capRound,
        chance: Math.round(chance * 1000) / 1000,
        classification: classify(query.percentile!, row.percentile),
        verified: Boolean(row.verifiedAt && row.sourceUrl),
        citation: citationFor(row),
      }
    })
    .sort((a, b) => b.chance - a.chance)
    .slice(0, 8)

  const citations = uniqueCitations(results.map((result) => result.citation))
  if (!citations.length) citations.push(...OFFICIAL_CITATIONS)

  if (!results.length) {
    return {
      answer: `I found no ${exam} ${category} cutoff row${query.branch ? ` for ${query.branch}` : ''}${query.city ? ` in ${query.city}` : ''}${query.budget ? ` under ₹${query.budget.toLocaleString('en-IN')}` : ''}. Try widening the branch, city, or budget.`,
      results: [],
      citations,
      assumptions: assumptionsFor(query, homeUniversity),
    }
  }

  const best = results[0]
  const safe = results.filter((result) => result.classification === 'Safe').length
  const unverified = results.filter((result) => !result.verified).length
  const answer = `With ${query.percentile} percentile (${exam} · ${category}), the strongest recorded option is ${best.college} for ${best.branch}, closing at ${best.cutoff} in round ${best.capRound} ${best.year}. ${safe} of the ${results.length} listed rows read as Safe, ${results.length - safe} as Target/Reach.${unverified ? ` ${unverified} row(s) are legacy/unverified — check the citation badge.` : ''}`

  return {
    answer,
    results,
    citations,
    assumptions: assumptionsFor(query, homeUniversity),
  }
}

async function answerDeadlines() {
  const deadlines = await prisma.admissionDeadline.findMany({
    where: { eventDate: { gte: new Date() } },
    orderBy: { eventDate: 'asc' },
    take: 8,
  })
  const results = deadlines.map((deadline) => ({
    title: deadline.title,
    date: deadline.eventDate.toISOString().slice(0, 10),
    category: deadline.category,
    citation: {
      source: 'CampusScope deadline registry',
      url: deadline.officialLink || 'https://cetcell.mahacet.org/',
      date: deadline.eventDate.toISOString().slice(0, 10),
      verified: Boolean(deadline.officialLink),
      confidence: deadline.officialLink ? 1 : 0.5,
    } satisfies Citation,
  }))
  return {
    answer: deadlines.length
      ? `The next recorded date is ${deadlines[0].title} on ${deadlines[0].eventDate.toISOString().slice(0, 10)}. Confirm it on the official portal — dates move.`
      : 'No upcoming deadlines are recorded. Check the official CET Cell portal for the live schedule.',
    results,
    citations: results.length ? uniqueCitations(results.map((result) => result.citation)) : OFFICIAL_CITATIONS,
    assumptions: ['Deadlines are only as fresh as the last registry update.'],
  }
}

async function answerEligibility(query: AdmissionQuery) {
  return {
    answer: `Eligibility depends on the exam, category certificate, domicile, and the specific institute's rules.${query.category ? ` You mentioned ${query.category}; keep the certificate ready and check the category-specific clause.` : ''} I can compare cutoffs, but I will not invent an eligibility ruling. Use the official information brochure.`,
    results: [],
    citations: OFFICIAL_CITATIONS,
    assumptions: ['Eligibility rules change by year and institute; no rule was inferred.'],
  }
}

async function answerFees(query: AdmissionQuery) {
  const colleges = await prisma.college.findMany({
    where: query.budget ? { fees: { lte: query.budget } } : {},
    select: {
      id: true,
      name: true,
      location: true,
      fees: true,
      sourceUrl: true,
      sourceName: true,
      sourceDate: true,
      verifiedAt: true,
      verifiedBy: true,
      confidence: true,
    },
    orderBy: { fees: 'asc' },
    take: 8,
  })
  const results = colleges.map((college) => ({
    collegeId: college.id,
    college: college.name,
    location: college.location,
    annualFees: college.fees,
    citation: citationFor(college),
  }))
  return {
    answer: results.length
      ? `The lowest recorded annual tuition in this filter is ₹${results[0].annualFees.toLocaleString('en-IN')} at ${results[0].college}. Tuition excludes hostel, deposits, and waivers; check the financial breakdown before budgeting.`
      : 'No college matches that budget in the catalog. Widen the budget or check the official fee brochure.',
    results,
    citations: results.length ? uniqueCitations(results.map((result) => result.citation)) : OFFICIAL_CITATIONS,
    assumptions: ['Annual tuition only; hostel, deposits, and scholarship waivers are separate.'],
  }
}

async function answerCompare(query: AdmissionQuery) {
  if (!query.colleges?.length) {
    return {
      answer: 'Name the colleges you want to compare, for example “COEP vs VJTI for Computer Engineering”.',
      results: [],
      citations: OFFICIAL_CITATIONS,
      assumptions: ['No college names were detected.'],
    }
  }

  const rows = await prisma.cutoff.findMany({
    where: {
      OR: query.colleges.map((name) => ({ college: { name: { contains: name, mode: 'insensitive' as const } } })),
      ...(query.exam ? { exam: toDbExam(query.exam) } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.branch ? { branch: { contains: query.branch, mode: 'insensitive' as const } } : {}),
    },
    include: { college: { select: { id: true, name: true, location: true } } },
    orderBy: { percentile: 'desc' },
    take: 60,
  })
  const results = dedupeLatestRound(rows)
    .slice(0, 12)
    .map((row) => ({
      collegeId: row.college.id,
      college: row.college.name,
      location: row.college.location,
      branch: row.branch,
      cutoff: row.percentile,
      year: row.year,
      capRound: row.capRound,
      citation: citationFor(row),
    }))

  return {
    answer: results.length
      ? `Found ${results.length} recorded cutoff row(s) across the named colleges. Compare the closing percentiles below, then check fees and seat matrix on each profile.`
      : 'No matching cutoff rows were found for those names. Check the spelling or widen the branch/category.',
    results,
    citations: results.length ? uniqueCitations(results.map((result) => result.citation)) : OFFICIAL_CITATIONS,
    assumptions: ['Comparison uses the latest recorded round per college + branch.'],
  }
}

function answerUnknown(query: AdmissionQuery) {
  return {
    answer: `I can predict Safe / Target / Reach options, compare colleges, check fees, explain deadlines, or point you to eligibility rules.${query.percentile === undefined ? ' Start with a percentile, category, exam, branch, or city.' : ''}`,
    results: [],
    citations: OFFICIAL_CITATIONS,
    assumptions: ['The request did not map to a supported intent.'],
  }
}

function assumptionsFor(query: AdmissionQuery, homeUniversity: boolean) {
  return [
    `Exam: ${query.exam ?? 'MHT-CET (default)'}.`,
    `Category: ${query.category ?? 'OPEN (default)'}.`,
    homeUniversity ? 'Home university quota assumed.' : 'Other-than-home quota applied (3-point penalty).',
    query.branch ? `Branch filter: ${query.branch}.` : 'All branches considered.',
    'Each percentage is attached to its recorded cutoff row; legacy rows are flagged unverified.',
  ]
}

function uniqueCitations(citations: Citation[]): Citation[] {
  return [
    ...new Map(
      citations.map((citation) => [`${citation.source}|${citation.url}|${citation.date}`, citation])
    ).values(),
  ]
}
