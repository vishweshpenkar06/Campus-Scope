import { describe, expect, test } from 'vitest'
import {
  assertPublishable,
  canApprove,
  citationFor,
  freshnessDays,
  isStale,
  isVerified,
} from './provenance'
import {
  normalizeBranch,
  normalizeCategory,
  normalizeCollegeName,
  normalizeCutoff,
  normalizeExam,
  normalizePercentile,
  normalizeRound,
} from './normalize'
import { MATCH_THRESHOLD, matchCollege, nameSimilarity } from './match'

const DAY = 86_400_000

describe('provenance', () => {
  test('only verified + sourced rows pass', () => {
    expect(isVerified({ verifiedAt: new Date(), sourceUrl: 'https://dte.maharashtra.gov.in' })).toBe(true)
    expect(isVerified({ verifiedAt: null, sourceUrl: 'https://dte.maharashtra.gov.in' })).toBe(false)
    expect(isVerified({ verifiedAt: new Date(), sourceUrl: '  ' })).toBe(false)
  })

  test('freshness and staleness', () => {
    const now = new Date('2026-11-01T00:00:00Z')
    expect(freshnessDays({ sourceDate: new Date('2026-10-01T00:00:00Z') }, now)).toBe(31)
    expect(freshnessDays({ sourceDate: null }, now)).toBeNull()
    expect(isStale({ sourceDate: new Date(now.getTime() - 181 * DAY) }, now)).toBe(true)
    expect(isStale({ sourceDate: new Date(now.getTime() - 10 * DAY) }, now)).toBe(false)
    expect(isStale({ sourceDate: null }, now)).toBe(true)
  })

  test('assertPublishable rejects unverified rows', () => {
    expect(() => assertPublishable([{ verifiedAt: null, sourceUrl: null }])).toThrow(/unverified/)
    expect(() =>
      assertPublishable([{ verifiedAt: new Date(), sourceUrl: 'https://example.gov.in/report.pdf' }])
    ).not.toThrow()
  })

  test('citation carries the source and verification state', () => {
    expect(
      citationFor({
        sourceName: 'DTE Maharashtra',
        sourceUrl: 'https://example.gov.in/cutoff.pdf',
        sourceDate: new Date('2026-01-12T00:00:00Z'),
        verifiedAt: new Date('2026-01-13T00:00:00Z'),
        confidence: 0.9,
      })
    ).toEqual({
      source: 'DTE Maharashtra',
      url: 'https://example.gov.in/cutoff.pdf',
      date: '2026-01-12',
      verified: true,
      confidence: 0.9,
    })
  })

  test('cannot approve an already-reviewed or unsourced record', () => {
    expect(() => canApprove({ status: 'approved', rawJson: { sourceUrl: 'x' } })).toThrow()
    expect(() => canApprove({ status: 'pending', rawJson: {} })).toThrow(/source URL/)
    expect(canApprove({ status: 'pending', rawJson: { sourceUrl: 'https://x' } })).toBe(true)
  })
})

describe('normalization', () => {
  test('categories, branches, exams, rounds', () => {
    expect(normalizeCategory('open')).toBe('OPEN')
    expect(normalizeCategory('General')).toBe('OPEN')
    expect(normalizeCategory('vj-nt')).toBe('VJ/NT')
    expect(normalizeCategory('PH')).toBe('PWD')
    expect(normalizeCategory('martian')).toBeNull()
    expect(normalizeBranch('CSE')).toBe('Computer Engineering')
    expect(normalizeBranch('COMP')).toBe('Computer Engineering')
    expect(normalizeBranch('EXTC')).toBe('Electronics & Telecommunication')
    expect(normalizeExam('MHT-CET')).toBe('CET')
    expect(normalizeExam('JEE Main')).toBe('JEE')
    expect(normalizeRound('CAP Round 3')).toBe(3)
    expect(normalizeRound('Spot Round')).toBe(4)
    expect(normalizeRound('round 9')).toBeNull()
    expect(normalizePercentile('85.456')).toBe(85.46)
    expect(normalizePercentile('145')).toBeNull()
  })

  test('college names collapse noise and expand acronyms', () => {
    expect(normalizeCollegeName('College of Engineering, Pune!')).toBe('pune')
    expect(normalizeCollegeName('IIT Bombay')).toBe('indian bombay')
    expect(normalizeCollegeName('Indian Institute of Technology Bombay')).toBe('indian bombay')
  })

  test('normalizeCutoff validates required fields and canonicalizes', () => {
    const result = normalizeCutoff({
      college: 'Saraswati College of Engineering',
      branch: 'COMP',
      category: 'open',
      round: 'CAP Round 2',
      percentile: '88.5',
      exam: 'MHT CET',
      year: 2025,
      sourceUrl: 'https://example.gov.in/cutoffs.pdf',
      sourceName: 'Fixture DTE',
      sourceDate: '2025-09-01',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.branch).toBe('Computer Engineering')
      expect(result.value.category).toBe('OPEN')
      expect(result.value.capRound).toBe(2)
      expect(result.value.percentile).toBe(88.5)
    }
    expect(normalizeCutoff({ college: 'X', category: 'OPEN', round: 1, percentile: 80, year: 2025 }).ok).toBe(false)
    expect(normalizeCutoff({ college: 'X', category: 'BAD', round: 1, percentile: 80, year: 2025, sourceUrl: 'u' }).ok).toBe(false)
  })
})

describe('college matching', () => {
  const colleges = [
    { id: 1, name: 'COEP Technological University' },
    { id: 2, name: 'Saraswati College of Engineering' },
    { id: 3, name: 'IIT Bombay' },
    { id: 4, name: 'Veermata Jijabai Technological Institute' },
  ]

  test('normalized names outrank noise', () => {
    expect(nameSimilarity('COEP College of Engineering', 'COEP Technological University')).toBe(1)
    expect(nameSimilarity('Indian Institute of Technology Bombay', 'IIT Bombay')).toBe(1)
  })

  test('match returns the best college above threshold', () => {
    expect(matchCollege('Saraswati College of Engineering, Kharghar', colleges)?.college.id).toBe(2)
    expect(matchCollege('VJTI Mumbai', colleges)?.college.id).toBe(4)
    expect(matchCollege('Completely Different Institute', colleges)).toBeNull()
    expect(matchCollege('Saraswati', colleges)?.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD)
  })
})
