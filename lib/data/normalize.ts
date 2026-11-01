// Canonical values for everything the ingestion pipeline touches. Keep this
// dependency-free: it runs in scripts, tests, and the review API.

export const CATEGORIES = [
  'OPEN',
  'OBC',
  'SC',
  'ST',
  'EWS',
  'TFWS',
  'VJ/NT',
  'SEBC',
  'PWD',
  'DEF',
  'ORPHAN',
  'JKM',
] as const

export type Category = (typeof CATEGORIES)[number]

const CATEGORY_SYNONYMS: Record<string, Category> = {
  OPEN: 'OPEN',
  GENERAL: 'OPEN',
  GOPEN: 'OPEN',
  OBC: 'OBC',
  'OBC-A': 'OBC',
  SC: 'SC',
  ST: 'ST',
  EWS: 'EWS',
  TFWS: 'TFWS',
  'VJ/NT': 'VJ/NT',
  'VJ-NT': 'VJ/NT',
  VJNT: 'VJ/NT',
  'VJ': 'VJ/NT',
  NT: 'VJ/NT',
  SEBC: 'SEBC',
  PWD: 'PWD',
  PH: 'PWD',
  DEF: 'DEF',
  DEFENCE: 'DEF',
  ORPHAN: 'ORPHAN',
  JKM: 'JKM',
  'J&K MIGRANT': 'JKM',
}

const BRANCH_SYNONYMS: Record<string, string> = {
  'COMPUTER ENGINEERING': 'Computer Engineering',
  COMPUTER: 'Computer Engineering',
  COMP: 'Computer Engineering',
  CSE: 'Computer Engineering',
  'CS': 'Computer Engineering',
  'COMPUTER SCIENCE': 'Computer Engineering',
  'COMPUTER SCIENCE AND ENGINEERING': 'Computer Engineering',
  'COMPUTER SCIENCE & ENGINEERING': 'Computer Engineering',
  'INFORMATION TECHNOLOGY': 'Information Technology',
  IT: 'Information Technology',
  'ELECTRONICS AND TELECOMMUNICATION': 'Electronics & Telecommunication',
  'ELECTRONICS & TELECOMMUNICATION': 'Electronics & Telecommunication',
  'ELECTRONICS AND COMMUNICATION': 'Electronics & Communication',
  'ELECTRONICS & COMMUNICATION': 'Electronics & Communication',
  ECE: 'Electronics & Communication',
  ENTC: 'Electronics & Telecommunication',
  EXTC: 'Electronics & Telecommunication',
  MECHANICAL: 'Mechanical Engineering',
  'MECHANICAL ENGINEERING': 'Mechanical Engineering',
  MECH: 'Mechanical Engineering',
  CIVIL: 'Civil Engineering',
  'CIVIL ENGINEERING': 'Civil Engineering',
  ELECTRICAL: 'Electrical Engineering',
  'ELECTRICAL ENGINEERING': 'Electrical Engineering',
  EEE: 'Electrical Engineering',
  'ARTIFICIAL INTELLIGENCE': 'Artificial Intelligence & Data Science',
  'AI AND DATA SCIENCE': 'Artificial Intelligence & Data Science',
  'AI & DATA SCIENCE': 'Artificial Intelligence & Data Science',
  AIDS: 'Artificial Intelligence & Data Science',
}

const DROP_TOKENS = new Set([
  'college',
  'of',
  'engineering',
  'institute',
  'technology',
  'technological',
  'university',
  'the',
  'and',
  '&',
])

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeCategory(value: string): Category | null {
  const key = normalizeWhitespace(value).toUpperCase().replace(/[._]/g, ' ').trim()
  return CATEGORY_SYNONYMS[key] ?? null
}

export function normalizeBranch(value: string): string {
  const key = normalizeWhitespace(value).toUpperCase().replace(/\s+/g, ' ').trim()
  return BRANCH_SYNONYMS[key] ?? normalizeWhitespace(value)
}

export function normalizeExam(value: string): 'CET' | 'JEE' | null {
  const key = normalizeWhitespace(value).toUpperCase()
  if (key.includes('CET') || key.includes('MAHARASHTRA')) return 'CET'
  if (key.includes('JEE')) return 'JEE'
  return null
}

export function normalizeRound(value: string | number): number | null {
  const key = String(value).toUpperCase()
  if (key.includes('SPOT')) return 4
  const match = key.match(/\d+/)
  if (!match) return null
  const round = Number(match[0])
  return round >= 1 && round <= 4 ? round : null
}

const COLLEGE_ACRONYMS: Record<string, string> = {
  iit: 'indian institute of technology',
  nit: 'national institute of technology',
  iiit: 'indian institute of information technology',
  vjti: 'veermata jijabai technological institute',
  spit: 'sardar patel institute of technology',
}

export function normalizeCollegeName(value: string): string {
  const tokens = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .flatMap((token) => (COLLEGE_ACRONYMS[token] ?? token).split(' '))
    .filter((token) => token && !DROP_TOKENS.has(token))
  return tokens.join(' ')
}

export function normalizePercentile(value: string | number): number | null {
  const number = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(number) || number < 0 || number > 100) return null
  return Math.round(number * 100) / 100
}

export function normalizeDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export type RawCutoff = {
  kind?: 'cutoff' | 'trend' | 'seat' | 'placement'
  college?: string
  collegeName?: string
  branch?: string
  category?: string
  round?: string | number
  capRound?: string | number
  exam?: string
  percentile?: string | number
  cutoff?: string | number
  year?: string | number
  sourceUrl?: string
  sourceName?: string
  sourceDate?: string
}

export type NormalizedCutoff = {
  collegeName: string
  branch: string
  category: Category
  capRound: number
  exam: 'CET' | 'JEE'
  percentile: number
  year: number
  sourceUrl: string
  sourceName: string
  sourceDate: Date | null
}

export type NormalizationResult =
  | { ok: true; value: NormalizedCutoff }
  | { ok: false; error: string }

export function normalizeCutoff(raw: RawCutoff): NormalizationResult {
  const collegeName = normalizeWhitespace(raw.collegeName ?? raw.college ?? '')
  if (!collegeName) return { ok: false, error: 'Missing college name' }

  const category = raw.category ? normalizeCategory(raw.category) : null
  if (!category) return { ok: false, error: `Unknown category: ${raw.category ?? '(missing)'}` }

  const capRound = normalizeRound(raw.capRound ?? raw.round ?? '')
  if (capRound === null) return { ok: false, error: 'Unknown CAP round' }

  const percentile = normalizePercentile(raw.percentile ?? raw.cutoff ?? '')
  if (percentile === null) return { ok: false, error: 'Invalid percentile' }

  const exam = normalizeExam(raw.exam ?? 'MHT-CET')
  if (!exam) return { ok: false, error: `Unknown exam: ${raw.exam}` }

  const year = Number(raw.year)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { ok: false, error: 'Invalid year' }
  }

  if (!raw.sourceUrl) return { ok: false, error: 'Missing source URL' }

  return {
    ok: true,
    value: {
      collegeName,
      branch: normalizeBranch(raw.branch ?? ''),
      category,
      capRound,
      exam,
      percentile,
      year,
      sourceUrl: raw.sourceUrl,
      sourceName: normalizeWhitespace(raw.sourceName ?? 'unknown'),
      sourceDate: normalizeDate(raw.sourceDate),
    },
  }
}
