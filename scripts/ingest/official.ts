import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { DteSeatType } from './dte'

export type OfficialSource = {
  id: string
  title: string
  url: string
  year: number
  capRound: number
  seatType: DteSeatType
  exam: 'CET' | 'JEE'
}

const MH = 'Maharashtra' as const

export const OFFICIAL_SOURCES: OfficialSource[] = [
  // 2026 — current cycle
  { id: '2026-cap1-mh', title: 'DTE Maharashtra CAP Round 1 2026', url: 'https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP1_MH_CutOff_V1.pdf', year: 2026, capRound: 1, seatType: MH, exam: 'CET' },
  { id: '2026-cap2-mh', title: 'DTE Maharashtra CAP Round 2 2026', url: 'https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP2_MH_CutOff.pdf', year: 2026, capRound: 2, seatType: MH, exam: 'CET' },
  { id: '2026-cap3-mh', title: 'DTE Maharashtra CAP Round 3 2026', url: 'https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP3_MH_CutOff.pdf', year: 2026, capRound: 3, seatType: MH, exam: 'CET' },
  { id: '2026-cap4-mh', title: 'DTE Maharashtra CAP Round 4 2026', url: 'https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP4_MH_CutOff.pdf', year: 2026, capRound: 4, seatType: MH, exam: 'CET' },
  // 2025
  { id: '2025-cap1-mh', title: 'DTE Maharashtra CAP Round 1 2025', url: 'https://fe2026.mahacet.org/2025/2025ENGG_CAP1_CutOff.pdf', year: 2025, capRound: 1, seatType: MH, exam: 'CET' },
  { id: '2025-cap2-mh', title: 'DTE Maharashtra CAP Round 2 2025', url: 'https://fe2026.mahacet.org/2025/2025ENGG_CAP2_CutOff.pdf', year: 2025, capRound: 2, seatType: MH, exam: 'CET' },
  { id: '2025-cap3-mh', title: 'DTE Maharashtra CAP Round 3 2025', url: 'https://fe2026.mahacet.org/2025/2025ENGG_CAP3_CutOff.pdf', year: 2025, capRound: 3, seatType: MH, exam: 'CET' },
  { id: '2025-cap4-mh', title: 'DTE Maharashtra CAP Round 4 2025', url: 'https://fe2026.mahacet.org/2025/2025ENGG_CAP4_CutOff.pdf', year: 2025, capRound: 4, seatType: MH, exam: 'CET' },
  // 2023 (legacy format, padded by the parser)
  { id: '2023-cap1-mh', title: 'DTE Maharashtra CAP Round 1 2023', url: 'https://fe2026.mahacet.org/2023/2023ENGG_CAP1_CutOff.pdf', year: 2023, capRound: 1, seatType: MH, exam: 'CET' },
  { id: '2023-cap2-mh', title: 'DTE Maharashtra CAP Round 2 2023', url: 'https://fe2026.mahacet.org/2023/2023ENGG_CAP2_CutOff.pdf', year: 2023, capRound: 2, seatType: MH, exam: 'CET' },
  { id: '2023-cap3-mh', title: 'DTE Maharashtra CAP Round 3 2023', url: 'https://fe2026.mahacet.org/2023/2023ENGG_CAP3_CutOff.pdf', year: 2023, capRound: 3, seatType: MH, exam: 'CET' },
  // 2024
  { id: '2024-cap1-mh', title: 'DTE Maharashtra CAP Round 1 2024', url: 'https://fe2026.mahacet.org/2024/2024ENGG_CAP1_CutOff.pdf', year: 2024, capRound: 1, seatType: MH, exam: 'CET' },
  { id: '2024-cap2-mh', title: 'DTE Maharashtra CAP Round 2 2024', url: 'https://fe2026.mahacet.org/2024/2024ENGG_CAP2_CutOff.pdf', year: 2024, capRound: 2, seatType: MH, exam: 'CET' },
  { id: '2024-cap3-mh', title: 'DTE Maharashtra CAP Round 3 2024', url: 'https://fe2026.mahacet.org/2024/2024ENGG_CAP3_CutOff.pdf', year: 2024, capRound: 3, seatType: MH, exam: 'CET' },
  // All-India / JEE cutoffs (same DTE CAP documents, separate tables)
  { id: '2026-cap1-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 1 2026', url: 'https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP1_AI_CutOff.pdf', year: 2026, capRound: 1, seatType: 'All India', exam: 'JEE' },
  { id: '2026-cap2-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 2 2026', url: 'https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP2_AI_CutOff.pdf', year: 2026, capRound: 2, seatType: 'All India', exam: 'JEE' },
  { id: '2026-cap3-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 3 2026', url: 'https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP3_AI_CutOff.pdf', year: 2026, capRound: 3, seatType: 'All India', exam: 'JEE' },
  { id: '2026-cap4-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 4 2026', url: 'https://cappublicdocs2026.blob.core.windows.net/documents/2026ENGG_CAP4_AI_CutOff.pdf', year: 2026, capRound: 4, seatType: 'All India', exam: 'JEE' },
  { id: '2025-cap1-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 1 2025', url: 'https://fe2026.mahacet.org/2025/2025ENGG_CAP1_AI_CutOff.pdf', year: 2025, capRound: 1, seatType: 'All India', exam: 'JEE' },
  { id: '2025-cap2-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 2 2025', url: 'https://fe2026.mahacet.org/2025/2025ENGG_CAP2_AI_CutOff.pdf', year: 2025, capRound: 2, seatType: 'All India', exam: 'JEE' },
  { id: '2025-cap3-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 3 2025', url: 'https://fe2026.mahacet.org/2025/2025ENGG_CAP3_AI_CutOff.pdf', year: 2025, capRound: 3, seatType: 'All India', exam: 'JEE' },
  { id: '2025-cap4-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 4 2025', url: 'https://fe2026.mahacet.org/2025/2025ENGG_CAP4_AI_CutOff.pdf', year: 2025, capRound: 4, seatType: 'All India', exam: 'JEE' },
  { id: '2024-cap1-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 1 2024', url: 'https://fe2026.mahacet.org/2024/2024ENGG_CAP1_AI_CutOff.pdf', year: 2024, capRound: 1, seatType: 'All India', exam: 'JEE' },
  { id: '2024-cap2-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 2 2024', url: 'https://fe2026.mahacet.org/2024/2024ENGG_CAP2_AI_CutOff.pdf', year: 2024, capRound: 2, seatType: 'All India', exam: 'JEE' },
  { id: '2024-cap3-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 3 2024', url: 'https://fe2026.mahacet.org/2024/2024ENGG_CAP3_AI_CutOff.pdf', year: 2024, capRound: 3, seatType: 'All India', exam: 'JEE' },
  { id: '2023-cap1-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 1 2023', url: 'https://fe2026.mahacet.org/2023/2023ENGG_CAP1_AI_CutOff.pdf', year: 2023, capRound: 1, seatType: 'All India', exam: 'JEE' },
  { id: '2023-cap2-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 2 2023', url: 'https://fe2026.mahacet.org/2023/2023ENGG_CAP2_AI_CutOff.pdf', year: 2023, capRound: 2, seatType: 'All India', exam: 'JEE' },
  { id: '2023-cap3-jee', title: 'DTE Maharashtra All India (JEE) CAP Round 3 2023', url: 'https://fe2026.mahacet.org/2023/2023ENGG_CAP3_AI_CutOff.pdf', year: 2023, capRound: 3, seatType: 'All India', exam: 'JEE' },
]

export type DownloadedSource = {
  source: OfficialSource
  pdfPath: string
  textPath: string
  sha256: string
  pageCount: number
  publishedAt: Date | null
  text: string
}

export async function downloadAndExtract(source: OfficialSource, options: { skipDownload?: boolean } = {}): Promise<DownloadedSource> {
  const cacheDir = resolve('.cache/dte')
  await mkdir(cacheDir, { recursive: true })
  const pdfPath = resolve(cacheDir, `${source.id}.pdf`)
  const textPath = resolve(cacheDir, `${source.id}.txt`)
  let publishedAt: Date | null = null

  const hasPdf = await exists(pdfPath)
  if (!options.skipDownload || !hasPdf) {
    const response = await fetch(source.url, {
      headers: { 'user-agent': 'CampusScope official data ingestion' },
      signal: AbortSignal.timeout(90_000),
    })
    if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    await writeFile(pdfPath, bytes)
    const lastModified = response.headers.get('last-modified')
    publishedAt = lastModified ? new Date(lastModified) : null
  }

  const bytes = await readFile(pdfPath)
  const sha256 = createHash('sha256').update(bytes).digest('hex')

  if (!(await exists(textPath)) || !options.skipDownload) {
    execFileSync('pdftotext', ['-layout', pdfPath, textPath], { stdio: 'pipe' })
  }
  const text = await readFile(textPath, 'utf8')

  let pageCount = text.split('\f').length
  try {
    const info = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' })
    const match = /^Pages:\s+(\d+)/m.exec(info)
    if (match) pageCount = Number(match[1])
  } catch {
    // pdftotext page count is a good fallback
  }

  return { source, pdfPath, textPath, sha256, pageCount, publishedAt, text }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
