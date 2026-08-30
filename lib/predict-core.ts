export type CutoffRow = {
  collegeId: number
  branch: string
  capRound: number
  percentile: number
}

export type ClassifiedCollege = {
  id: number
  name: string
  location: string
  percentile: number
  branch: string
  capRound: number
  classification: 'Safe' | 'Target' | 'Reach'
}

/**
 * Predicts college classification based on percentile band boundaries.
 * @param percentile Candidate percentile
 * @param cutoff Closing percentile
 * @returns 'Safe', 'Target', or 'Reach'
 */
export function classify(percentile: number, cutoff: number): 'Safe' | 'Target' | 'Reach' {
  if (percentile >= cutoff + 2.0) return 'Safe'
  if (percentile >= cutoff - 2.0) return 'Target'
  return 'Reach'
}

/**
 * Dedupes cutoff rows to keep only the latest round's closing percentile per college+branch.
 * @param rows Array of cutoff rows
 * @returns Deduped rows
 */
export function dedupeLatestRound<T extends CutoffRow>(rows: T[]): T[] {
  const best = new Map<string, T>()
  for (const row of rows) {
    const key = `${row.collegeId}|${row.branch}`
    const current = best.get(key)
    if (
      !current ||
      row.capRound > current.capRound ||
      (row.capRound === current.capRound && row.percentile < current.percentile)
    ) {
      best.set(key, row)
    }
  }
  return [...best.values()]
}

export function computeScore(summary: { safe: number; target: number; reach: number }, matches: number, budget?: number, location?: string) {
  const matchScore = matches > 0 ? ((summary.safe * 3 + summary.target * 2 + summary.reach) / matches) * 50 : 0
  // budget/location only add signal when there is something to match against
  const bonus = matches > 0 ? (budget ? Math.min(20, budget / 5) : 10) + (location ? 5 : 0) : 0
  return Math.min(95, Math.round(matchScore + bonus))
}
