import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

// Wikimedia Commons only. Free licences, real campus photographs, attribution
// stored with each college. No stock-photo placeholders are presented as the
// actual campus.
const API = 'https://commons.wikimedia.org/w/api.php'
const USER_AGENT = 'CampusScope/1.0 (college photo enrichment; contact: campusscope)'
const SEARCH_ALIASES: Record<string, string> = {
  '16006': 'COEP Pune',
  '03012': 'VJTI Mumbai',
  '03215': 'Sardar Patel Institute of Technology Mumbai',
  '06271': 'Pune Institute of Computer Technology',
  '06273': 'Vishwakarma Institute of Technology Pune',
  '06276': 'Cummins College of Engineering for Women Pune',
  '03199': 'Dwarkadas Sanghvi College of Engineering Mumbai',
  '03182': 'Thadomal Shahani Engineering College Mumbai',
  '06177': 'Sinhgad College of Engineering Pune',
  '01002': 'Government College of Engineering Amravati',
  '01012': 'Government College of Engineering Yavatmal',
  '01101': 'Shri Sant Gajanan Maharaj College of Engineering Shegaon',
  '06007': 'Walchand College of Engineering Sangli',
  '06146': 'MIT Academy of Engineering Alandi Pune',
  '04167': 'Yeshwantrao Chavan College of Engineering Nagpur',
  '03184': 'Fr Conceicao Rodrigues College of Engineering Mumbai',
  '03204': 'St Francis Institute of Technology Mumbai',
  '03135': 'Rajiv Gandhi Institute of Technology Mumbai',
  '03203': 'Atharva College of Engineering Mumbai',
  '03139': 'Vidyalankar Institute of Technology Mumbai',
  '03147': 'Saraswati College of Engineering Kharghar',
  '03207': 'Pillai College of Engineering New Panvel',
  '03223': 'Pillai HOC College of Engineering Rasayani',
  '03189': 'Bharati Vidyapeeth College of Engineering Navi Mumbai',
  '06288': 'Bharati Vidyapeeth College of Engineering Kolhapur',
  '03210': 'K C College of Engineering Mumbai',
  '03460': 'Universal College of Engineering Kaman',
  '06625': 'Universal College of Engineering Sasewadi',
  '02113': 'Maharashtra Institute of Technology Aurangabad',
  '03725': 'Maharashtra Institute of Technology Thane',
}

const GENERIC = new Set([
  'college', 'engineering', 'technology', 'institute', 'university', 'government',
  'autonomous', 'society', 'education', 'educational', 'research', 'campus', 'school',
  'management', 'science', 'sciences', 'arts', 'commerce', 'trust', 'group',
  'institutions', 'institution', 'integrated', 'technical', 'polytechnic', 'campus',
  'shri', 'smt', 'late', 'the', 'and', 'for', 'of', 'at', 'in',
])

type CommonsPage = {
  title: string
  index?: number
  imageinfo?: Array<{
    thumburl?: string
    url?: string
    descriptionurl?: string
    mime?: string
    width?: number
    height?: number
    extmetadata?: Record<string, { value?: string }>
  }>
}

function stripHtml(value: string | undefined): string {
  if (!value) return ''
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function distinctiveTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 5 && !GENERIC.has(token))
}

function titleMatches(title: string, name: string, location: string): boolean {
  const normalizedTitle = title.toLowerCase()
  const tokens = distinctiveTokens(name)
  if (tokens.some((token) => normalizedTitle.includes(token))) return true
  if (location && location !== 'Maharashtra' && normalizedTitle.includes(location.toLowerCase())) {
    return tokens.length === 0
  }
  return false
}

function allowedLicense(license: string): boolean {
  return /^(cc0|public domain|cc by|cc-by|pd)/i.test(license)
}

async function search(name: string, location: string): Promise<{ page: CommonsPage; license: string; credit: string } | null> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${name} ${location === 'Maharashtra' ? '' : location}`.trim(),
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '1400',
    format: 'json',
    formatversion: '2',
  })
  let response: Response | null = null
  for (let attempt = 0; attempt < 4; attempt++) {
    response = await fetch(`${API}?${params}`, {
      headers: { 'user-agent': USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    })
    if (response.status !== 429) break
    const retryAfter = Number(response.headers.get('retry-after') ?? 5)
    await new Promise((resolve) => setTimeout(resolve, Math.max(5, retryAfter) * 1000))
  }
  if (!response?.ok) return null
  const body = (await response.json()) as { query?: { pages?: CommonsPage[] } }
  const pages = (body.query?.pages ?? []).sort((a, b) => (a.index ?? 99) - (b.index ?? 99))

  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (!info || !info.mime?.startsWith('image/')) continue
    if ((info.width ?? 0) < 800 || (info.height ?? 0) < 450) continue
    const license = stripHtml(info.extmetadata?.LicenseShortName?.value)
    if (!allowedLicense(license)) continue
    if (!titleMatches(page.title, name, location)) continue
    const credit = stripHtml(info.extmetadata?.Artist?.value) || 'Wikimedia Commons contributor'
    return { page, license, credit }
  }
  return null
}

function cleanUrl(url: string): string {
  return url.split('?')[0]
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
  const onlyArg = process.argv.find((arg) => arg.startsWith('--only='))
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',').map((code) => code.trim()).filter(Boolean) : []
  const limit = Math.min(400, Number(limitArg?.split('=')[1] ?? 180) || 180)
  const force = process.argv.includes('--force')

  const prisma = new PrismaClient()
  try {
    const colleges = await prisma.college.findMany({
      where: {
        instituteCode: only.length ? { in: only } : { not: null },
        ...(force ? {} : { photoUrl: null }),
      },
      orderBy: { cutoffs: { _count: 'desc' } },
      take: only.length || limit,
      select: { id: true, name: true, location: true, instituteCode: true },
    })

    const credits: Array<Record<string, unknown>> = []
    let matched = 0
    for (const college of colleges) {
      const queryName = SEARCH_ALIASES[college.instituteCode ?? ''] ?? college.name
      const result = await search(queryName, college.location).catch(() => null)
      if (!result) {
        await new Promise((resolve) => setTimeout(resolve, 1100))
        continue
      }
      const info = result.page.imageinfo![0]
      const url = cleanUrl(info.thumburl ?? info.url ?? '')
      if (!url) continue
      await prisma.college.update({
        where: { id: college.id },
        data: {
          photoUrl: url,
          photoCredit: result.credit.slice(0, 240),
          photoLicense: result.license,
          photoSourceUrl: info.descriptionurl ?? null,
        },
      })
      matched++
      credits.push({
        instituteCode: college.instituteCode,
        college: college.name,
        photo: url,
        credit: result.credit,
        license: result.license,
        source: info.descriptionurl,
        file: result.page.title,
      })
      console.log(`[${matched}/${colleges.length}] ${college.name}`)
      await new Promise((resolve) => setTimeout(resolve, 280))
    }

    await mkdir(resolve('docs'), { recursive: true })
    await writeFile(resolve('docs/photo-credits.json'), `${JSON.stringify(credits, null, 2)}\n`)
    await writeFile(
      resolve('docs/photo-credits.md'),
      `# Photo credits\n\nAll images are from Wikimedia Commons under a free licence. ` +
        `CampusScope does not present them as its own photography.\n\n` +
        `| Institute | College | Credit | Licence | Source |\n|---|---|---|---|---|\n` +
        credits
          .map(
            (row) =>
              `| ${row.instituteCode} | ${String(row.college).replace(/\|/g, '\\|')} | ${String(row.credit).replace(/\|/g, '\\|')} | ${row.license} | [Commons](${row.source}) |`
          )
          .join('\n') +
        '\n'
    )
    console.log(`\nMatched ${matched} of ${colleges.length} colleges.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
