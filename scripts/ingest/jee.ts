import type { DteParseResult, ParsedDteCutoff } from './dte'

// All-India / JEE cutoffs use a flat table:
// Sr | All India Merit | Choice Code | Institute | Course | Exam | Type | Seat Type
// We anchor on the merit/percentile/choice/institute columns and resolve the
// branch from the CET choice-code map during ingestion.
export function parseJeeCutoffText(
  text: string,
  options: { year: number; capRound: number }
): DteParseResult {
  void options
  const rows: ParsedDteCutoff[] = []
  const warnings: string[] = []
  const institutes = new Set<string>()
  const branches = new Set<string>()
  const pages = text.split('\f')

  for (let page = 0; page < pages.length; page++) {
    let collegeName = ''
    for (const line of pages[page].split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('Legends:')) continue

      const institute = /^(\d{4,5})\s*-\s*(.+)$/.exec(trimmed)
      if (institute) {
        collegeName = institute[2].trim()
        continue
      }

      const match = /^\s*(\d+)\s+(\d+)\s+\(([\d.]+)\)\s+(\d{9,10}[A-Z]*)\s+(\d{4,5})\b/.exec(line)
      if (!match) continue

      const instituteCode = match[5].padStart(5, '0')
      const branchMatch = /^(\d+)([A-Z]*)$/.exec(match[4])!
      const branchCode = branchMatch[1].padStart(10, '0') + branchMatch[2]
      const rank = Number(match[2])
      const percentile = Number(match[3])
      if (!Number.isFinite(percentile) || percentile < 0 || percentile > 100) {
        warnings.push(`page ${page + 1}: JEE percentile out of range ${match[3]}`)
        continue
      }
      institutes.add(instituteCode)
      branches.add(`${instituteCode}|${branchCode}`)
      rows.push({
        instituteCode,
        collegeName: collegeName || `Institute ${instituteCode}`,
        branchCode,
        branchName: '',
        level: 'All India',
        seatType: 'All India',
        stage: 'AI',
        categoryCode: 'AI',
        category: 'OPEN',
        rank,
        percentile: Math.round(percentile * 1e7) / 1e7,
        page: page + 1,
      })
    }
  }

  return { rows, warnings, pages: pages.length, institutes: institutes.size, branches: branches.size }
}
