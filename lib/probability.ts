// ponytail: logistic single-parameter model on historical closing cutoffs — transparent, tunable,
// and honest about being directional. Upgrade path: fit k and quota shifts against real allotment data.

export type RoundCutoffs = {
  round1Cutoff: number
  round2Cutoff: number
  round3Cutoff: number
  spotRoundCutoff: number | null
}

export type ProbabilityOptions = {
  spread?: number
  otherThanHomePenalty?: number
  sampleSize?: number
}

export const PROBABILITY_MODEL_VERSION = 'logistic-1.1.0'
export const PROBABILITY_SPREAD = 1.2 // percentile points of the logistic transition width
export const OTHER_THAN_HOME_PENALTY = 3 // percentile points lost when applying outside home university quota

// P(candidate clears a cutoff that closed at `cutoff`); exactly 0.5 at the boundary.
export function clearChance(percentile: number, cutoff: number, spread = PROBABILITY_SPREAD): number {
  return 1 / (1 + Math.exp((cutoff - percentile) / spread))
}

export function modelMetadata(options: ProbabilityOptions = {}) {
  return {
    modelVersion: PROBABILITY_MODEL_VERSION,
    spread: options.spread ?? PROBABILITY_SPREAD,
    otherThanHomePenalty: options.otherThanHomePenalty ?? OTHER_THAN_HOME_PENALTY,
    sampleSize: options.sampleSize ?? null,
  }
}

export function roundChances(
  percentile: number,
  cutoffs: RoundCutoffs,
  homeUniversity = true,
  options: ProbabilityOptions = {}
): { round1: number; round2: number; round3: number; spot: number } {
  const penalty = options.otherThanHomePenalty ?? OTHER_THAN_HOME_PENALTY
  const spread = options.spread ?? PROBABILITY_SPREAD
  const effective = homeUniversity ? percentile : percentile - penalty
  const raw = {
    round1: clearChance(effective, cutoffs.round1Cutoff, spread),
    round2: clearChance(effective, cutoffs.round2Cutoff, spread),
    round3: clearChance(effective, cutoffs.round3Cutoff, spread),
    spot: cutoffs.spotRoundCutoff === null ? null : clearChance(effective, cutoffs.spotRoundCutoff, spread),
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

export function probabilityAssumptions(input: {
  exam: string
  category: string
  homeUniversity: boolean
  sampleSize?: number | null
}): string[] {
  return [
    `Model ${PROBABILITY_MODEL_VERSION}: logistic curve fitted to historical closing cutoffs, not an allotment simulation.`,
    `Inputs: ${input.exam} · ${input.category} · ${input.homeUniversity ? 'home university quota' : 'other-than-home quota'}.`,
    input.homeUniversity
      ? 'Home university quota applied.'
      : `Other-than-home quota: effective percentile reduced by ${OTHER_THAN_HOME_PENALTY} points.`,
    input.sampleSize
      ? `Calibration sample: ${input.sampleSize} historical trend row(s).`
      : 'No calibration sample size was available for this query.',
    'Every percentage is attached to its source row. Legacy rows are flagged as unverified.',
    'Directional estimate from historical trends, not an admission guarantee.',
  ]
}
