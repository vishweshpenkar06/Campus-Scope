import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { parseJeeCutoffText } from '../../scripts/ingest/jee'

const fixture = (name: string) => readFileSync(resolve('scripts/ingest/fixtures', name), 'utf8')

describe('JEE / All-India cutoff parser', () => {
  test('parses 2026 AI rows', () => {
    const result = parseJeeCutoffText(fixture('jee-2026-cap3-page1.txt'), { year: 2026, capRound: 3 })
    expect(result.warnings).toEqual([])
    expect(result.rows.length).toBeGreaterThan(5)
    expect(result.rows[0]).toMatchObject({
      instituteCode: '01105',
      branchCode: '0110519110',
      category: 'OPEN',
      seatType: 'All India',
      level: 'All India',
      rank: 18534,
      percentile: 84.652105,
    })
  })

  test('parses 2023 AI rows with short codes', () => {
    const result = parseJeeCutoffText(fixture('jee-2023-cap3-page1.txt'), { year: 2023, capRound: 3 })
    expect(result.warnings).toEqual([])
    expect(result.rows[0]).toMatchObject({
      instituteCode: '06006',
      branchCode: '0600624510',
      rank: 319,
      percentile: 99.2779416,
    })
  })
})
