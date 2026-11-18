import assert from 'node:assert/strict'
import { bestRoundOutcome, roundChances } from '../lib/probability'
import { classify, computeScore, dedupeLatestRound } from '../lib/predict-core'
import { findOrderWarnings, simulateAllotment, type SimulatorChoice } from '../lib/simulator'

// classify: ±2.0 percentile band boundaries
assert.equal(classify(95, 92.9), 'Safe') // >= cutoff + 2
assert.equal(classify(94, 92), 'Safe') // boundary: exactly cutoff + 2
assert.equal(classify(93.5, 92), 'Target') // within ±2
assert.equal(classify(90, 92), 'Target') // boundary: exactly cutoff - 2
assert.equal(classify(89.5, 92), 'Reach') // below cutoff - 2

// dedupeLatestRound: keeps the latest round's closing cutoff per college+branch
const rows = [
  { collegeId: 1, branch: 'CS', capRound: 1, percentile: 95 },
  { collegeId: 1, branch: 'CS', capRound: 3, percentile: 91.5 },
  { collegeId: 1, branch: 'CS', capRound: 3, percentile: 92 }, // same round → keep lower (final close)
  { collegeId: 1, branch: 'IT', capRound: 2, percentile: 88 },
]
const deduped = dedupeLatestRound(rows)
assert.equal(deduped.length, 2)
assert.equal(deduped[0].capRound, 3)
assert.equal(deduped[0].percentile, 91.5)
// newer year always outranks a later round from an older year
const yearRows = [
  { collegeId: 1, branch: 'CS', capRound: 3, percentile: 88, year: 2024 },
  { collegeId: 1, branch: 'CS', capRound: 1, percentile: 95, year: 2026 },
]
assert.equal(dedupeLatestRound(yearRows)[0].year, 2026)

// computeScore: no matches → no misleading bonus points
assert.deepEqual(computeScore({ safe: 0, target: 0, reach: 0 }, 0, 50, 'Pune'), 0)
// all-safe mix saturates at the 95 ceiling
assert.equal(computeScore({ safe: 5, target: 0, reach: 0 }, 5, undefined, undefined), 95)
assert.ok(computeScore({ safe: 10, target: 0, reach: 0 }, 10, 100, 'Mumbai') <= 95)

console.log('predict-core selfcheck passed')

// simulator: order warnings + allotment walk
const mk = (id: number, name: string, cutoff: number): SimulatorChoice => ({ collegeId: id, name, branch: 'CS', cutoff })
// descending (ideal) order ? no warnings
assert.equal(findOrderWarnings([mk(1, 'A', 95), mk(2, 'B', 90)]).length, 0)
// easy college above a harder one the student would also clear ? warn on the harder one
const warned = findOrderWarnings([mk(2, 'B', 90), mk(1, 'A', 95)])
assert.equal(warned.length, 1)
assert.equal(warned[0].index, 1)
// duplicates flagged
assert.ok(findOrderWarnings([mk(1, 'A', 95), mk(1, 'A', 95)]).some((w) => w.message.includes('Duplicate')))
// allotment: first choice the percentile clears; null when nothing clears
assert.equal(simulateAllotment([mk(2, 'B', 91), mk(1, 'A', 88)], 92.4)?.choice.name, 'B')
assert.equal(simulateAllotment([mk(2, 'B', 91), mk(1, 'A', 88)], 80), null)

console.log('simulator selfcheck passed')

// probability engine: logistic monotonicity, quota penalty, best-round selection
const cutoffs = { round1Cutoff: 96, round2Cutoff: 94.5, round3Cutoff: 93, spotRoundCutoff: 91 }
assert.ok(roundChances(95, cutoffs).round2 > roundChances(93, cutoffs).round2, 'higher percentile ? higher chance')
assert.ok(roundChances(95, cutoffs).round3 > roundChances(95, cutoffs).round1, 'later rounds easier (cutoffs drop)')
assert.ok(roundChances(95, cutoffs, false).round2 < roundChances(95, cutoffs, true).round2, 'OTH quota penalised')
const chances = roundChances(94.4, cutoffs)
const best = bestRoundOutcome(chances)
assert.equal(best.roundLabel, 'CAP Round 3') // 94.4 clears r3 comfortably, r2 at boundary
assert.ok(best.probability > 0.5)

console.log('probability selfcheck passed')


// scholarship matrix: income gating + no-stacking best-waiver math
import { bestNetTuitionPerYear, schemeMatrix, type ConcessionPolicy } from '../lib/scholarships'
const policy: ConcessionPolicy = { ebcConcessionPct: 50, tfwsConcessionPct: 100, scStConcessionPct: 100, minorityConcessionPct: 30 }
const openLow = schemeMatrix('OPEN', 'under25L', policy)
assert.ok(openLow.find((r) => r.name === 'TFWS Tuition Waiver')!.eligible)
assert.equal(bestNetTuitionPerYear(200000, openLow), 0) // TFWS 100% wins
const openHigh = schemeMatrix('OPEN', 'above8L', policy)
assert.ok(!openHigh.find((r) => r.name === 'EBC Scholarship')!.eligible)
assert.equal(bestNetTuitionPerYear(200000, openHigh), 200000) // nothing applies
const scRows = schemeMatrix('SC', 'above8L', policy) // caste waiver ignores income
assert.ok(scRows.find((r) => r.name === 'SC/ST Fee Reimbursement')!.eligible)
// EBC halves between 2.5L–8L: pct drops to half even though TFWS still wins overall
assert.equal(schemeMatrix('OBC', 'under25L', policy).find((r) => r.name === 'EBC Scholarship')!.concessionPct, 50)
assert.equal(schemeMatrix('OBC', 'under8L', policy).find((r) => r.name === 'EBC Scholarship')!.concessionPct, 25)
assert.equal(bestNetTuitionPerYear(200000, schemeMatrix('OBC', 'under8L', policy)), 0) // TFWS 100% still applies

console.log('scholarship selfcheck passed')
