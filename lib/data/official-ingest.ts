import type { PrismaClient } from '@prisma/client'
import type { ParsedDteCutoff } from '../../scripts/ingest/dte'
import { normalizeBranch } from './normalize'

export type OfficialSourceMeta = {
  title: string
  url: string
  year: number
  capRound: number
  seatType: string
  exam: 'CET' | 'JEE'
  sha256: string
  pageCount: number
  publishedAt: Date | null
}

export type IngestResult = {
  sourceUrl: string
  sourceDocumentId: number
  rowsParsed: number
  rowsImported: number
  rowsSkipped: number
  colleges: number
}

// DTE changed some institute codes between cycles (e.g. COEP 6006 -> 16006).
const INSTITUTE_CODE_ALIASES: Record<string, string> = {
  '06006': '16006',
}

function canonicalInstituteCode(code: string): string {
  return INSTITUTE_CODE_ALIASES[code] ?? code
}

function canonicalBranchCode(branchCode: string | null, originalInstitute: string, canonicalInstitute: string): string | null {
  if (!branchCode) return null
  return branchCode.startsWith(originalInstitute)
    ? canonicalInstitute + branchCode.slice(originalInstitute.length)
    : branchCode
}

export async function ingestOfficialRows(
  prisma: PrismaClient,
  rows: ParsedDteCutoff[],
  meta: OfficialSourceMeta
): Promise<IngestResult> {
  const branchByCode = new Map<string, string>()
  if (meta.exam === 'JEE') {
    const branchRows = await prisma.$queryRaw<Array<{ branchCode: string; branch: string }>>`
      SELECT DISTINCT ON ("branchCode") "branchCode", "branch"
      FROM "Cutoff"
      WHERE "exam" = 'CET' AND "branchCode" IS NOT NULL
    `
    for (const row of branchRows) branchByCode.set(row.branchCode, row.branch)
  }

  const sourceDocument = await prisma.sourceDocument.upsert({
    where: { url: meta.url },
    update: {
      title: meta.title,
      year: meta.year,
      capRound: meta.capRound,
      seatType: meta.seatType,
      sha256: meta.sha256,
      pageCount: meta.pageCount,
      fetchedAt: new Date(),
      publishedAt: meta.publishedAt,
    },
    create: {
      url: meta.url,
      title: meta.title,
      year: meta.year,
      capRound: meta.capRound,
      seatType: meta.seatType,
      sha256: meta.sha256,
      pageCount: meta.pageCount,
      publishedAt: meta.publishedAt,
    },
  })

  // Re-ingesting a document replaces exactly that document's rows. Other
  // sources/years are untouched.
  await prisma.cutoff.deleteMany({ where: { sourceDocumentId: sourceDocument.id } })

  const collegeIds = new Map<string, number>()
  for (const instituteCode of new Set(rows.map((row) => canonicalInstituteCode(row.instituteCode)))) {
    const sample = rows.find((row) => canonicalInstituteCode(row.instituteCode) === instituteCode)!
    const existing = await prisma.college.findUnique({
      where: { instituteCode },
      select: { id: true, location: true },
    })
    if (existing) {
      collegeIds.set(instituteCode, existing.id)
      if (existing.location === 'Maharashtra') {
        const location = deriveLocation(instituteCode, sample.collegeName)
        if (location !== 'Maharashtra') {
          await prisma.college.update({ where: { id: existing.id }, data: { location } })
        }
      }
      continue
    }
    const college = await prisma.college.create({
      data: {
        instituteCode,
        name: sample.collegeName,
        location: deriveLocation(instituteCode, sample.collegeName),
        fees: 0,
        rating: 0,
        overview: `Official DTE Maharashtra institute ${instituteCode}. Cutoff rows are imported from public CAP documents; fees, placements, and reviews are not yet verified for this institute.`,
        sourceName: meta.title,
        sourceUrl: meta.url,
        sourceDate: meta.publishedAt ?? new Date(),
        verifiedAt: new Date(),
        verifiedBy: 'dte-parser-v1',
        confidence: 0.98,
      },
      select: { id: true },
    })
    collegeIds.set(instituteCode, college.id)
  }

  let rowsImported = 0
  let rowsSkipped = 0
  const batchSize = 2000
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize)
    const data = batch.flatMap((row) => {
      const canonicalCode = canonicalInstituteCode(row.instituteCode)
      const branchCode = canonicalBranchCode(row.branchCode, row.instituteCode, canonicalCode)
      const branch = meta.exam === 'JEE'
        ? (branchCode ? branchByCode.get(branchCode) : undefined) ?? row.branchName
        : normalizeBranch(row.branchName)
      if (!branch) {
        rowsSkipped++
        return []
      }
      return [{
      collegeId: collegeIds.get(canonicalCode)!,
      exam: meta.exam,
      capRound: meta.capRound,
      category: row.category,
      categoryCode: row.categoryCode,
      branch,
      branchCode,
      percentile: row.percentile,
      rank: row.rank,
      stage: row.stage,
      level: row.level,
      seatType: meta.seatType,
      year: meta.year,
      sourcePage: row.page,
      sourceDocumentId: sourceDocument.id,
      sourceUrl: meta.url,
      sourceName: meta.title,
      sourceDate: meta.publishedAt ?? new Date(),
      verifiedAt: new Date(),
      verifiedBy: 'dte-parser-v1',
      confidence: 0.98,
      }]
    })
    const created = await prisma.cutoff.createMany({ data })
    rowsImported += created.count
  }

  await prisma.sourceDocument.update({
    where: { id: sourceDocument.id },
    data: { rowsImported },
  })

  return {
    sourceUrl: meta.url,
    sourceDocumentId: sourceDocument.id,
    rowsParsed: rows.length,
    rowsImported,
    rowsSkipped,
    colleges: collegeIds.size,
  }
}

export async function rebuildTrends(prisma: PrismaClient): Promise<number> {
  const groups = await prisma.$queryRaw<
    Array<{
      collegeId: number
      branch: string
      category: string
      year: number
      exam: string
      r1: number | null
      r2: number | null
      r3: number | null
      r4: number | null
      sourceUrl: string | null
      sourceDate: Date | null
    }>
  >`
    SELECT "collegeId", "branch", "category", "year", "exam",
      MAX(CASE WHEN "capRound" = 1 THEN "percentile" END) AS r1,
      MAX(CASE WHEN "capRound" = 2 THEN "percentile" END) AS r2,
      MAX(CASE WHEN "capRound" = 3 THEN "percentile" END) AS r3,
      MAX(CASE WHEN "capRound" = 4 THEN "percentile" END) AS r4,
      MIN("sourceUrl") AS "sourceUrl",
      MAX("sourceDate") AS "sourceDate"
    FROM "Cutoff"
    WHERE "category" NOT IN ('MINORITY')
    GROUP BY "collegeId", "branch", "category", "year", "exam"
  `

  await prisma.capRoundTrend.deleteMany()
  const data = groups
    .filter((group) => group.r1 !== null || group.r3 !== null)
    .map((group) => ({
      collegeId: group.collegeId,
      year: group.year,
      exam: group.exam,
      category: group.category,
      branch: group.branch,
      round1Cutoff: group.r1 ?? group.r2 ?? group.r3 ?? 0,
      round2Cutoff: group.r2 ?? group.r1 ?? group.r3 ?? 0,
      round3Cutoff: group.r3 ?? group.r2 ?? group.r1 ?? 0,
      spotRoundCutoff: group.r4,
      sourceName: 'DTE Maharashtra (derived from CAP cutoffs)',
      sourceUrl: group.sourceUrl,
      sourceDate: group.sourceDate,
      verifiedAt: new Date(),
      verifiedBy: 'dte-parser-v1',
      confidence: 0.95,
    }))

  for (let index = 0; index < data.length; index += 2000) {
    await prisma.capRoundTrend.createMany({ data: data.slice(index, index + 2000) })
  }
  return data.length
}

export async function dataQualityReport(prisma: PrismaClient) {
  const [cutoffs, colleges, documents, trends] = await Promise.all([
    prisma.cutoff.count(),
    prisma.college.count({ where: { instituteCode: { not: null } } }),
    prisma.sourceDocument.count(),
    prisma.capRoundTrend.count(),
  ])

  const byYear = await prisma.cutoff.groupBy({
    by: ['year', 'capRound'],
    _count: { _all: true },
    orderBy: [{ year: 'desc' }, { capRound: 'asc' }],
  })
  const byCategory = await prisma.cutoff.groupBy({
    by: ['category'],
    _count: { _all: true },
    orderBy: { _count: { category: 'desc' } },
  })
  const byLevel = await prisma.cutoff.groupBy({
    by: ['level'],
    _count: { _all: true },
  })
  const insufficient = await prisma.cutoff.count({
    where: { OR: [{ sourceUrl: null }, { verifiedAt: null }, { percentile: { lt: 0 } }, { percentile: { gt: 100 } }] },
  })
  const duplicateRows = await prisma.$queryRaw<Array<{ groups: number; extra: number }>>`
    SELECT count(*)::int AS groups, COALESCE(sum(c - 1), 0)::int AS extra
    FROM (
      SELECT "collegeId", "year", "capRound", "branchCode", "categoryCode", "stage", "level", count(*) AS c
      FROM "Cutoff"
      GROUP BY 1, 2, 3, 4, 5, 6, 7
      HAVING count(*) > 1
    ) duplicates
  `

  return {
    generatedAt: new Date().toISOString(),
    cutoffs,
    colleges,
    documents,
    trends,
    rowsMissingSourceOrOutOfRange: insufficient,
    duplicateGroups: duplicateRows[0]?.groups ?? 0,
    duplicateExtraRows: duplicateRows[0]?.extra ?? 0,
    byYear: byYear.map((row) => ({ year: row.year, capRound: row.capRound, rows: row._count._all })),
    byCategory: byCategory.map((row) => ({ category: row.category, rows: row._count._all })),
    byLevel: byLevel.map((row) => ({ level: row.level ?? 'unknown', rows: row._count._all })),
  }
}

const KNOWN_LOCATIONS: Record<string, string> = {
  '16006': 'Pune',
}

const CITIES = [
  'Navi Mumbai', 'Pimpri-Chinchwad', 'Pimpri', 'Chinchwad', 'Mumbai', 'Pune', 'Nagpur', 'Nashik',
  'Amravati', 'Yavatmal', 'Sangli', 'Solapur', 'Kolhapur', 'Chhatrapati Sambhajinagar', 'Aurangabad',
  'Nanded', 'Thane', 'Ratnagiri', 'Satara', 'Ahmednagar', 'Jalgaon', 'Akola', 'Latur', 'Chandrapur',
  'Wardha', 'Parbhani', 'Dhule', 'Sindhudurg', 'Gondia', 'Bhandara', 'Gadchiroli', 'Washim',
  'Buldhana', 'Beed', 'Jalna', 'Hingoli', 'Panvel', 'Ulhasnagar', 'Kalyan', 'Bhiwandi', 'Vasai',
  'Virar', 'Alibag', 'Karad', 'Ichalkaranji', 'Malegaon', 'Ambarnath', 'Badlapur', 'Khopoli',
]

export function deriveLocation(instituteCode: string, name: string): string {
  if (KNOWN_LOCATIONS[instituteCode]) return KNOWN_LOCATIONS[instituteCode]
  const city = CITIES.find((candidate) => new RegExp(`\\b${candidate}\\b`, 'i').test(name))
  if (city) return city
  return locationFromName(name)
}

function locationFromName(name: string): string {
  const parts = name.split(',').map((part) => part.trim()).filter(Boolean)
  const last = parts.at(-1)
  if (!last) return 'Maharashtra'
  if (/maharashtra|university|institute|college|technology|engineering|management|research/i.test(last)) {
    return 'Maharashtra'
  }
  return last
}
