import { describe, expect, test } from 'vitest'
import {
  PROBABILITY_MODEL_VERSION,
  bestRoundOutcome,
  clearChance,
  modelMetadata,
  probabilityAssumptions,
  roundChances,
} from './probability'

const cutoffs = { round1Cutoff: 96, round2Cutoff: 94.5, round3Cutoff: 93, spotRoundCutoff: 91 }

describe('probability model', () => {
  test('boundary is exactly 0.5', () => {
    expect(clearChance(93, 93)).toBe(0.5)
    expect(roundChances(93, cutoffs).round3).toBe(0.5)
  })

  test('chance increases with percentile', () => {
    expect(roundChances(95, cutoffs).round2).toBeGreaterThan(roundChances(93, cutoffs).round2)
  })

  test('later rounds are never harder', () => {
    const chances = roundChances(94.4, cutoffs)
    expect(chances.round1).toBeLessThanOrEqual(chances.round2)
    expect(chances.round2).toBeLessThanOrEqual(chances.round3)
    expect(chances.round3).toBeLessThan(chances.spot)
  })

  test('missing spot round is extrapolated, not dropped', () => {
    const chances = roundChances(94.4, { ...cutoffs, spotRoundCutoff: null })
    expect(Number.isFinite(chances.spot)).toBe(true)
    expect(chances.spot).toBeGreaterThan(chances.round3)
  })

  test('a non-monotonic source spot cutoff is discarded', () => {
    const chances = roundChances(94.4, { ...cutoffs, spotRoundCutoff: 99 })
    expect(chances.spot).toBeGreaterThan(chances.round3)
  })

  test('other-than-home quota is penalised', () => {
    expect(roundChances(95, cutoffs, false).round2).toBeLessThan(
      roundChances(95, cutoffs, true).round2
    )
  })

  test('custom spread changes steepness without breaking the boundary', () => {
    expect(clearChance(93, 93, 0.5)).toBe(0.5)
    expect(clearChance(94, 93, 0.5)).toBeGreaterThan(clearChance(94, 93, 1.2))
  })

  test('chances stay inside [0, 1]', () => {
    for (const percentile of [0, 25, 50, 75, 100]) {
      const chances = roundChances(percentile, cutoffs)
      for (const value of Object.values(chances)) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })

  test('model metadata is versioned and carries sample size', () => {
    expect(modelMetadata({ sampleSize: 42 })).toEqual({
      modelVersion: PROBABILITY_MODEL_VERSION,
      spread: 1.2,
      otherThanHomePenalty: 3,
      sampleSize: 42,
    })
  })

  test('best round skips spot and picks the strongest regular round', () => {
    const best = bestRoundOutcome(roundChances(94.4, cutoffs))
    expect(best.roundLabel).toBe('CAP Round 3')
    expect(best.probability).toBeGreaterThan(0.5)
  })

  test('assumptions name the model and the calibration sample', () => {
    const assumptions = probabilityAssumptions({
      exam: 'CET',
      category: 'OPEN',
      homeUniversity: true,
      sampleSize: 12,
    })
    expect(assumptions.join(' ')).toContain(PROBABILITY_MODEL_VERSION)
    expect(assumptions.join(' ')).toContain('12 historical trend row(s)')
  })

  test('no sample produces an explicit caveat', () => {
    const assumptions = probabilityAssumptions({
      exam: 'JEE',
      category: 'OBC',
      homeUniversity: false,
    })
    expect(assumptions.join(' ')).toContain('No calibration sample size')
    expect(assumptions.join(' ')).toContain('reduced by 3 points')
  })
})
