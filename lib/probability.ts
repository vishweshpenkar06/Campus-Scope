// ponytail: logistic single-parameter model on historical closing cutoffs — transparent, tunable,
// and honest about being directional. Upgrade path: fit k and quota shifts against real allotment data.

export type RoundCutoffs = {
  round1Cutoff: number
  round2Cutoff: number
  round3Cutoff: number
  spotRoundCutoff: number | null
}

export const PROBABILITY_SPREAD = 1.2 // percentile points of the logistic transition width
export const OTHER_THAN_HOME_PENALTY = 3 // percentile points lost when applying outside home university quota

// P(candidate clears a cutoff that closed at `cutoff`); exactly 0.5 at the boundary.
function clearChance(percentile: number, cutoff: number, spread = PROBABILITY_SPREAD): number {
  return 1 / (1 + Math.exp((cutoff - percentile) / spread))
}

export function roundChances(
  percentile: number,
  cutoffs: RoundCutoffs,
  homeUniversity = true
): { round1: number; round2: number; round3: number; spot: number } {
  const effective = homeUniversity ? percentile : percentile - OTHER_THAN_HOME_PENALTY
  const raw = {
    round1: clearChance(effective, cutoffs.round1Cutoff),
    round2: clearChance(effective, cutoffs.round2Cutoff),
    round3: clearChance(effective, cutoffs.round3Cutoff),
    spot: cutoffs.spotRoundCutoff === null ? null : clearChance(effective, cutoffs.spotRoundCutoff),
  }
  // rounds only get easier as vacancies roll down — enforce monotonic non-decreasing chances
  if (raw.spot !== null && raw.spot < raw.round3) raw.spot = null
  return { ...raw, spot: raw.spot ?? Math.min(0.99, raw.round3 * 1.05) }
}

const ROUND_LABELS: [keyof ReturnType<typeof roundChances>, string][] = [
  ['round1', 'CAP Round 1'],
  ['round2', 'CAP Round 2'],
  ['round3', 'CAP Round 3'],
  ['spot', 'Spot Round'],
]

// Best realistic outcome: highest-chance regular round (spot shown separately — it means you missed all three).
export function bestRoundOutcome(chances: ReturnType<typeof roundChances>) {
  let bestKey: keyof typeof chances = 'round1'
  for (const key of ['round2', 'round3'] as const) {
    if (chances[key] > chances[bestKey]) bestKey = key
  }
  const label = ROUND_LABELS.find(([key]) => key === bestKey)![1]
  return { roundLabel: label, probability: chances[bestKey] }
}
