import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  dteLevelForCode,
  normalizeDteCategory,
  parseDteCutoffText,
} from '../../scripts/ingest/dte'

const fixture = (name: string) =>
  readFileSync(resolve('scripts/ingest/fixtures', name), 'utf8')

describe('DTE cutoff parser', () => {
  test('parses 2026 CAP 3 page 1 with zero warnings', () => {
    const result = parseDteCutoffText(fixture('dte-2026-cap3-page1.txt'), {
      year: 2026,
      capRound: 3,
    })
    expect(result.warnings).toEqual([])
    expect(result.institutes).toBe(1)
    expect(result.branches).toBe(4)
    expect(result.rows.length).toBeGreaterThan(20)

    const first = result.rows[0]
    expect(first).toMatchObject({
      instituteCode: '01002',
      branchCode: '0100219110',
      branchName: 'Civil Engineering',
      stage: 'I',
      categoryCode: 'GOPENS',
      category: 'OPEN',
      rank: 31460,
      percentile: 92.5616727,
      level: 'State Level',
      seatType: 'Maharashtra',
    })
  })

  test('handles stage VII and minority stage rows', () => {
    const result = parseDteCutoffText(fixture('dte-2026-cap3-page1.txt'), {
      year: 2026,
      capRound: 3,
    })
    const orphan = result.rows.find((row) => row.stage === 'VII')
    expect(orphan).toMatchObject({
      category: 'ORPHAN',
      rank: 34506,
      percentile: 91.8268053,
    })
  })

  test('parses I-Non PWD rows without losing the percentile', () => {
    const result = parseDteCutoffText(fixture('dte-2026-cap2-page2.txt'), {
      year: 2026,
      capRound: 2,
    })
    expect(result.warnings).toEqual([])
    const pwd = result.rows.find((row) => row.stage === 'I-Non PWD')
    expect(pwd).toMatchObject({
      category: 'PWD',
      rank: 34483,
      percentile: 91.8268053,
    })
  })

  test('separates home and other-than-home candidate sections', () => {
    const result = parseDteCutoffText(fixture('dte-2024-cap2-page5.txt'), {
      year: 2024,
      capRound: 2,
    })
    const lopenh = result.rows.filter((row) => row.categoryCode === 'LOPENH')
    expect(lopenh).toHaveLength(2)
    expect(new Set(lopenh.map((row) => row.level))).toEqual(
      new Set(['Home University', 'Other than Home University'])
    )
  })

  test('pads 2023 four-digit institute codes and nine-digit branch codes', () => {
    const result = parseDteCutoffText(fixture('dte-2023-cap3-page1.txt'), {
      year: 2023,
      capRound: 3,
    })
    expect(result.warnings).toEqual([])
    expect(result.rows[0]).toMatchObject({
      instituteCode: '01002',
      branchCode: '0100219110',
      stage: 'I',
      category: 'OPEN',
    })
  })

  test('parses the 2024 CAP 1 format', () => {
    const result = parseDteCutoffText(fixture('dte-2024-cap1-page1.txt'), {
      year: 2024,
      capRound: 1,
    })
    expect(result.warnings).toEqual([])
    expect(result.institutes).toBe(1)
    expect(result.rows.length).toBeGreaterThan(20)
    expect(result.rows[0].instituteCode).toBe('01002')
    expect(result.rows.every((row) => row.seatType === 'Maharashtra')).toBe(true)
  })

  test('normalizes gender, level and category suffixes', () => {
    expect(normalizeDteCategory('GSCH')).toBe('SC')
    expect(normalizeDteCategory('GSEBCH')).toBe('SEBC')
    expect(normalizeDteCategory('LOPENH')).toBe('OPEN')
    expect(normalizeDteCategory('GOPENO')).toBe('OPEN')
    expect(normalizeDteCategory('GVJO')).toBe('VJ/NT')
    expect(normalizeDteCategory('EWSS')).toBe('EWS')
    expect(normalizeDteCategory('MI')).toBe('MINORITY')
    expect(normalizeDteCategory('NOTACATEGORY')).toBeNull()
  })

  test('maps header suffixes to levels', () => {
    expect(dteLevelForCode('GSCH', 'State Level')).toBe('Home University')
    expect(dteLevelForCode('GOPENO', 'State Level')).toBe('Other than Home University')
    expect(dteLevelForCode('GOPENS', 'State Level')).toBe('State Level')
    expect(dteLevelForCode('MI', 'State Level')).toBe('State Level')
    expect(dteLevelForCode('GSCH', 'State Level')).not.toBe('Other than Home University')
  })
})
