import { matchCollege, type MatchableCollege } from '../../lib/data/match'
import { normalizeCutoff } from '../../lib/data/normalize'
import type { RawIngestRecord } from './types'

export type IngestReport = {
  parsed: number
  valid: number
  invalid: number
  matched: number
  unmatched: number
  matchRate: number
  sampleUnmatched: string[]
  sampleErrors: string[]
  published: false
}

export function buildIngestReport(
  records: RawIngestRecord[],
  catalog: MatchableCollege[],
  url: string
): IngestReport {
  let valid = 0
  let invalid = 0
  let matched = 0
  const unmatched: string[] = []
  const errors: string[] = []

  for (const record of records) {
    const normalized = normalizeCutoff({ ...record, sourceUrl: record.sourceUrl ?? url })
    if (!normalized.ok) {
      invalid++
      if (errors.length < 5) errors.push(normalized.error)
      continue
    }
    valid++
    if (matchCollege(normalized.value.collegeName, catalog)) matched++
    else if (unmatched.length < 10) unmatched.push(normalized.value.collegeName)
  }

  return {
    parsed: records.length,
    valid,
    invalid,
    matched,
    unmatched: valid - matched,
    matchRate: valid ? Math.round((matched / valid) * 1000) / 10 : 0,
    sampleUnmatched: unmatched,
    sampleErrors: errors,
    published: false,
  }
}
