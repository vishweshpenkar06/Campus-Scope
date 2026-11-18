import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { normalizeBranch } from '../../lib/data/normalize'

export type SeatRow = {
  instituteCode: string
  collegeName: string
  branchCode: string
  branch: string
  sanctionIntake: number
  msSeats: number
  minoritySeats: number
  allIndiaSeats: number
  instituteSeats: number
  orphanInstitutional: number
  orphanNonInstitutional: number
  openSeats: number
  obcSeats: number
  scSeats: number
  stSeats: number
  tfwsSeats: number
  page: number
}

const URL = 'https://cappublicdocs2026.blob.core.windows.net/documents/2026_fe_seatmatrix_V1.pdf'

export function parseSeatMatrixText(text: string): SeatRow[] {
  const rows: SeatRow[] = []
  const pages = text.split('\f')
  let instituteCode = ''
  let collegeName = ''
  let current: SeatRow | null = null
  for (let page = 0; page < pages.length; page++) {
    for (const line of pages[page].split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const institute = /^(\d{5})\s*-\s*(.+)$/.exec(trimmed)
      if (institute) {
        instituteCode = institute[1]
        collegeName = institute[2].trim()
        continue
      }
      if (/^State Level/i.test(trimmed) && current) {
        const values = [...trimmed.matchAll(/\d+/g)].map((m) => Number(m[0]))
        if (values.length >= 18) {
          current.openSeats = values[0] + values[1]
          current.scSeats = values[2] + values[3]
          current.stSeats = values[4] + values[5]
          current.obcSeats = values[14] + values[15]
        }
        continue
      }
      const tfws = /Tution Fee Waiver Scheme.*?Seats:\s*(\d+)/i.exec(trimmed)
      if (tfws && current) {
        current.tfwsSeats = Number(tfws[1])
        continue
      }
      if (!instituteCode || !/^\d{10}[A-Z]*\s/.test(trimmed)) continue
      const match = /^(\d{10}[A-Z]*)\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/.exec(trimmed)
      if (!match) continue
      current = {
        instituteCode,
        collegeName,
        branchCode: match[1],
        branch: normalizeBranch(match[2].trim()),
        sanctionIntake: Number(match[3]),
        msSeats: Number(match[4]),
        minoritySeats: Number(match[5]),
        allIndiaSeats: Number(match[6]),
        instituteSeats: Number(match[7]),
        orphanInstitutional: Number(match[8]),
        orphanNonInstitutional: Number(match[9]),
        openSeats: 0,
        obcSeats: 0,
        scSeats: 0,
        stSeats: 0,
        tfwsSeats: 0,
        page: page + 1,
      }
      rows.push(current)
    }
  }
  return rows
}

async function main() {
  const cacheDir = resolve('.cache/dte')
  await mkdir(cacheDir, { recursive: true })
  const pdfPath = resolve(cacheDir, 'seatmatrix-2026.pdf')
  const textPath = resolve(cacheDir, 'seatmatrix-2026.txt')
  const response = await fetch(URL, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) throw new Error(`Seat matrix HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  await writeFile(pdfPath, bytes)
  execFileSync('pdftotext', ['-layout', pdfPath, textPath], { stdio: 'pipe' })
  const text = await readFile(textPath, 'utf8')
  const rows = parseSeatMatrixText(text)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const publishedAt = new Date('2026-07-27T00:00:00Z')

  console.log(`parsed ${rows.length} seat rows · sha ${sha256.slice(0, 12)} · ${text.split('\f').length} pages`)

  const prisma = new PrismaClient()
  try {
    const colleges = await prisma.college.findMany({
      where: { instituteCode: { not: null } },
      select: { id: true, instituteCode: true },
    })
    const idByCode = new Map(colleges.map((college) => [college.instituteCode!, college.id]))
    let imported = 0
    for (const row of rows) {
      const collegeId = idByCode.get(row.instituteCode)
      if (!collegeId) continue
      await prisma.seatMatrix.upsert({
        where: { collegeId_branch: { collegeId, branch: row.branch } },
        update: {
          totalSeats: row.sanctionIntake,
          openSeats: row.openSeats,
          obcSeats: row.obcSeats,
          scSeats: row.scSeats,
          stSeats: row.stSeats,
          tfwsSeats: row.tfwsSeats,
          allIndiaSeats: row.allIndiaSeats,
          sourceUrl: URL,
          sourceName: 'DTE Maharashtra Seat Matrix 2026',
          sourceDate: publishedAt,
          verifiedAt: new Date(),
          verifiedBy: 'seatmatrix-parser-v1',
          confidence: 0.95,
        },
        create: {
          collegeId,
          branch: row.branch,
          totalSeats: row.sanctionIntake,
          openSeats: row.openSeats,
          obcSeats: row.obcSeats,
          scSeats: row.scSeats,
          stSeats: row.stSeats,
          tfwsSeats: row.tfwsSeats,
          allIndiaSeats: row.allIndiaSeats,
          sourceUrl: URL,
          sourceName: 'DTE Maharashtra Seat Matrix 2026',
          sourceDate: publishedAt,
          verifiedAt: new Date(),
          verifiedBy: 'seatmatrix-parser-v1',
          confidence: 0.95,
        },
      })
      imported++
    }
    console.log(`imported ${imported} seat-matrix rows`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
