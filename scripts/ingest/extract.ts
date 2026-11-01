import type { ExtractInput, IngestFormat, RawIngestRecord } from './types'
import { ocrPdf } from './ocr'

export function detectFormat(contentType: string, url: string): IngestFormat {
  const type = contentType.toLowerCase()
  if (type.includes('pdf') || url.toLowerCase().endsWith('.pdf')) return 'pdf'
  if (type.includes('json') || url.toLowerCase().endsWith('.json')) return 'json'
  if (type.includes('csv') || url.toLowerCase().endsWith('.csv')) return 'csv'
  return 'text'
}

export async function extractRecords(input: ExtractInput): Promise<RawIngestRecord[]> {
  if (input.format === 'pdf') {
    if (!input.bytes) throw new Error('PDF extraction requires bytes')
    return extractPdf(input.bytes)
  }
  const text = input.text ?? (input.bytes ? new TextDecoder().decode(input.bytes) : '')
  if (!text.trim()) throw new Error('Source contains no readable text')
  if (input.format === 'json') return parseJson(text)
  return parseDelimited(text)
}

async function extractPdf(bytes: Uint8Array): Promise<RawIngestRecord[]> {
  const { extractText, getDocumentProxy } = await import('unpdf')
  const document = await getDocumentProxy(bytes)
  const { text } = await extractText(document, { mergePages: true })
  const merged = Array.isArray(text) ? text.join('\n') : text

  // Scanned PDFs have no text layer. OCR is an optional adapter so the base
  // install stays small; install tesseract.js only when a scanned source lands.
  if (merged.trim().length < 200) {
    const ocrText = await ocrPdf(bytes)
    return parseDelimited(ocrText)
  }
  return parseDelimited(merged)
}

function parseJson(text: string): RawIngestRecord[] {
  const parsed: unknown = JSON.parse(text)
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { records?: unknown }).records)
      ? (parsed as { records: unknown[] }).records
      : null
  if (!rows) throw new Error('JSON source must be an array or { records: [] }')
  return rows.filter((row): row is RawIngestRecord => Boolean(row && typeof row === 'object'))
}

function parseDelimited(text: string): RawIngestRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
  if (!lines.length) return []

  const delimiter = lines[0].includes('|') ? '|' : lines[0].includes('\t') ? '\t' : ','
  const first = splitLine(lines[0], delimiter)
  const header = first.map((cell) => cell.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const known = new Set([
    'college',
    'collegename',
    'branch',
    'category',
    'round',
    'capround',
    'exam',
    'percentile',
    'cutoff',
    'year',
    'sourceurl',
    'sourcename',
    'sourcedate',
  ])
  const hasHeader = header.some((cell) => known.has(cell))
  const body = hasHeader ? lines.slice(1) : lines

  return body.map((line) => {
    const cells = splitLine(line, delimiter)
    if (!hasHeader) {
      const [college, branch, category, round, percentile, year, exam] = cells
      return { college, branch, category, round, percentile, year, exam }
    }
    const row: Record<string, string> = {}
    header.forEach((key, index) => {
      row[key] = cells[index] ?? ''
    })
    return {
      college: row.college || row.collegename,
      branch: row.branch,
      category: row.category,
      round: row.round,
      capRound: row.capround,
      exam: row.exam,
      percentile: row.percentile,
      cutoff: row.cutoff,
      year: row.year,
      sourceUrl: row.sourceurl,
      sourceName: row.sourcename,
      sourceDate: row.sourcedate,
    }
  })
}

function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}
