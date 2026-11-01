// Provenance is the trust boundary: a row is publishable only when a human has
// verified it and an official source URL is attached. Everything else is
// visible but flagged, never silently treated as official.

export const LEGACY_SOURCE_NAME = 'legacy'
export const STALE_AFTER_DAYS = 180

export type ProvenanceRow = {
  sourceUrl: string | null
  sourceName?: string | null
  sourceDate?: Date | null
  verifiedAt: Date | null
  verifiedBy?: string | null
  confidence?: number | null
}

export type Citation = {
  source: string
  url: string | null
  date: string | null
  verified: boolean
  confidence: number
}

const DAY_MS = 86_400_000

export function isVerified(row: { verifiedAt: Date | null; sourceUrl: string | null }): boolean {
  return row.verifiedAt !== null && Boolean(row.sourceUrl?.trim())
}

export function freshnessDays(row: { sourceDate: Date | null }, now = new Date()): number | null {
  if (!row.sourceDate) return null
  const time = row.sourceDate.getTime()
  if (Number.isNaN(time)) return null
  return Math.max(0, Math.floor((now.getTime() - time) / DAY_MS))
}

export function isStale(row: { sourceDate: Date | null }, now = new Date()): boolean {
  const days = freshnessDays(row, now)
  return days === null || days > STALE_AFTER_DAYS
}

export function assertPublishable(rows: Array<{ verifiedAt: Date | null; sourceUrl: string | null }>): void {
  const unverified = rows.filter((row) => !isVerified(row))
  if (unverified.length) {
    throw new Error(
      `Refusing to publish ${unverified.length} unverified row(s). Verify a source first.`
    )
  }
}

export function citationFor(row: ProvenanceRow): Citation {
  return {
    source: row.sourceName?.trim() || LEGACY_SOURCE_NAME,
    url: row.sourceUrl,
    date: row.sourceDate ? row.sourceDate.toISOString().slice(0, 10) : null,
    verified: isVerified(row),
    confidence: row.confidence ?? (isVerified(row) ? 1 : 0.5),
  }
}

export type StagingStatus = 'pending' | 'approved' | 'rejected'

export function canApprove(record: { status: string; rawJson: unknown }): true {
  if (record.status !== 'pending') throw new Error(`Record is already ${record.status}.`)
  const raw = record.rawJson as Record<string, unknown>
  if (!raw || typeof raw !== 'object') throw new Error('Staging record has no payload.')
  if (!raw.sourceUrl || typeof raw.sourceUrl !== 'string') {
    throw new Error('Cannot approve a record without a source URL.')
  }
  return true
}
