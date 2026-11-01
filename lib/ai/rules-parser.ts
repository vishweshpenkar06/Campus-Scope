import type { AdmissionQuery, AdmissionIntent } from './query'
import { CATEGORIES, normalizeCategory } from '@/lib/data/normalize'

const BRANCHES: Array<[RegExp, string]> = [
  [/computer\s+(?:science(?:\s*(?:&|and)\s*engineering)?|engineering)|\bcse\b|\bCS\b|\bcomp(?:uter)?s?\b/i, 'Computer Engineering'],
  [/information\s+technology|\bIT\b/i, 'Information Technology'],
  [/\bentc\b|\bextc\b|electronics\s*(?:&|and)\s*telecommunication/i, 'Electronics & Telecommunication'],
  [/electronics\s*(?:&|and)\s*communication|\bece\b/i, 'Electronics & Communication'],
  [/mechanical|\bmech\b/i, 'Mechanical Engineering'],
  [/\bcivil\b/i, 'Civil Engineering'],
  [/electrical|\beee\b/i, 'Electrical Engineering'],
  [/artificial\s+intelligence|data\s+science|\baids\b|\bAI\b/i, 'Artificial Intelligence & Data Science'],
]

const CITIES = [
  'Mumbai',
  'Navi Mumbai',
  'Thane',
  'Pune',
  'Nagpur',
  'Nashik',
  'Aurangabad',
  'Chhatrapati Sambhajinagar',
  'Kolhapur',
  'Solapur',
  'Amravati',
  'Nanded',
  'Sangli',
  'Jalgaon',
  'Akola',
  'Latur',
  'Dhule',
  'Ahmednagar',
  'Chandrapur',
  'Parbhani',
  'Wardha',
  'Yavatmal',
  'Ratnagiri',
  'Satara',
  'Sindhudurg',
]

const CATEGORY_WORDS = [...CATEGORIES, 'GENERAL', 'VJNT', 'PH', 'DEFENCE']
  .sort((a, b) => b.length - a.length)
  .map((value) => value.replace(/[/&]/g, '[/&]?'))
const CATEGORY_RE = new RegExp(`\\b(${CATEGORY_WORDS.join('|')})\\b`, 'i')

const COLLEGE_ACRONYMS = /\b(?:COEP|VJTI|SPIT|PICT|VIT|MIT|IIT|NIT|IIIT|BITS|VESIT|DJSCE|KJSCE|TSEC|SIES|FCRIT|AISSMS)\b/g
const COLLEGE_NAMES =
  /((?:[A-Z][\w&.'-]*\s+){1,7}(?:College of Engineering|Institute of Technology|College|Institute|University))/g

const BUILT_INS = new Set([
  'IIT',
  'NIT',
  'IIIT',
  'CET',
  'MHT',
  'JEE',
  'OPEN',
  'OBC',
  'SC',
  'ST',
  'EWS',
  'TFWS',
  'PWD',
  'DEF',
  'JKM',
  'SEBC',
  'AI',
  'IT',
  'CS',
  'CSE',
  'VJ',
  'NT',
])

export function parseAdmissionQuery(raw: string): AdmissionQuery {
  const text = raw.replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()
  const intent = detectIntent(lower)
  if (intent === 'unknown') return { intent }
  const percentile = extractPercentile(text)
  const category = extractCategory(text)
  const branch = extractBranch(text)
  const city = [...CITIES]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => new RegExp(`\\b${candidate}\\b`, 'i').test(text))
  const budget = extractBudget(text)
  const exam = extractExam(text)
  const colleges = intent === 'compare' || intent === 'fees' ? extractColleges(text) : []
  const homeUniversity = /other[\s-]*than[\s-]*home|outside home|non[\s-]*home/.test(lower)
    ? false
    : /home university|home quota|state quota/.test(lower)
      ? true
      : undefined

  return {
    intent,
    ...(exam ? { exam } : {}),
    ...(percentile !== null ? { percentile } : {}),
    ...(category ? { category } : {}),
    ...(branch ? { branch } : {}),
    ...(city ? { city } : {}),
    ...(budget !== null ? { budget } : {}),
    ...(homeUniversity !== undefined ? { homeUniversity } : {}),
    ...(colleges.length ? { colleges } : {}),
  }
}

function detectIntent(lower: string): AdmissionIntent {
  if (/\bdeadline\b|last date|when (?:is|do|does|should).{0,20}(?:apply|admission)|important dates?|schedule/.test(lower)) {
    return 'deadline'
  }
  if (/\bfees?\b|tuition|hostel (?:fee|cost)|total cost|afford|cheaper|how much|charge/.test(lower)) return 'fees'
  if (/eligib|reservation|can i apply|am i eligible|quota rules|domicile|certificate/.test(lower)) return 'eligibility'
  if (/\bcompare\b|\bvs\.?\b|versus|better (?:than|college)|which is better/.test(lower)) return 'compare'
  if (/chance|predict|admission|cutoff|cut-off|safe|target|reach|colleges? for|where can i get|\bget into\b|shortlist/.test(lower)) {
    return 'predict'
  }
  return extractPercentile(lower) !== null ? 'predict' : 'unknown'
}

function extractPercentile(text: string): number | null {
  const patterns = [
    /(\d{1,3}(?:\.\d+)?)\s*(?:%|percentile|percentileile|percent\b)/i,
    /percentile\s*(?:of|is|:|=)?\s*(\d{1,3}(?:\.\d+)?)/i,
    /(\d{1,3}(?:\.\d+)?)\s*(?:marks?|score)\b/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    const value = Number(match[1])
    if (Number.isFinite(value) && value >= 0 && value <= 100) {
      return Math.round(value * 100) / 100
    }
  }
  return null
}

function extractCategory(text: string): string | null {
  const match = text.match(CATEGORY_RE)
  if (!match) return null
  return normalizeCategory(match[1]) ?? null
}

function extractBranch(text: string): string | null {
  for (const [pattern, branch] of BRANCHES) {
    if (pattern.test(text)) return branch
  }
  return null
}

function extractExam(text: string): 'MHT-CET' | 'JEE' | undefined {
  if (/mht[\s-]*cet|\bcet\b|maharashtra/i.test(text)) return 'MHT-CET'
  if (/\bjee\b|joint entrance/i.test(text)) return 'JEE'
  return undefined
}

function extractBudget(text: string): number | null {
  const match = text.match(
    /(?:under|below|within|budget(?: of)?|less than|max(?:imum)?|fees? (?:under|below|of)?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|l\b|k\b|thousand)?/i
  )
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  const unit = (match[2] ?? '').toLowerCase()
  if (unit.startsWith('l')) return Math.round(value * 100_000)
  if (unit === 'k' || unit === 'k\b' || unit.startsWith('thousand')) return Math.round(value * 1_000)
  // "budget 2" almost always means 2 lakh in this context
  return value > 0 && value < 50 ? Math.round(value * 100_000) : Math.round(value)
}

function extractColleges(text: string): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(COLLEGE_NAMES)) {
    const name = match[1].trim()
    if (name.length >= 4) found.add(name)
  }
  for (const match of text.matchAll(COLLEGE_ACRONYMS)) {
    if (!BUILT_INS.has(match[0])) found.add(match[0])
  }
  return [...found].slice(0, 5)
}
