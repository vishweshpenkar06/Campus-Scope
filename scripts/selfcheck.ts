import assert from 'node:assert/strict'
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

// computeScore: no matches → no misleading bonus points
assert.deepEqual(computeScore({ safe: 0, target: 0, reach: 0 }, 0, 50, 'Pune'), 0)
// all-safe mix saturates at the 95 ceiling
assert.equal(computeScore({ safe: 5, target: 0, reach: 0 }, 5, undefined, undefined), 95)
assert.ok(computeScore({ safe: 10, target: 0, reach: 0 }, 10, 100, 'Mumbai') <= 95)

console.log('predict-core selfcheck passed')
