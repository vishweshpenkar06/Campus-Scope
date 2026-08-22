export type SimulatorChoice = {
  collegeId: number
  name: string
  branch: string
  cutoff: number // latest-round closing percentile for the candidate's exam/category
}

export type ChoiceWarning = { index: number; message: string }

// CAP allots the first choice whose closing cutoff you clear — so a harder (higher-cutoff)
// choice sitting below an easier one is unreachable if you clear the easier one first.
export function findOrderWarnings(choices: SimulatorChoice[]): ChoiceWarning[] {
  const warnings: ChoiceWarning[] = []
  let highestCutoff = -Infinity
  choices.forEach((choice, index) => {
    if (choice.cutoff > highestCutoff) highestCutoff = choice.cutoff
    else if (choice.cutoff < highestCutoff)
      warnings.push({
        index,
        message: `Lower cutoff than an earlier choice (${highestCutoff.toFixed(2)}) — this seat would likely be consumed before reaching it. Move safer/easier options below your top picks.`,
      })
  })

  const seen = new Map<string, number>()
  choices.forEach((choice, index) => {
    const key = `${choice.collegeId}|${choice.branch}`
    const first = seen.get(key)
    if (first !== undefined)
      warnings.push({ index, message: `Duplicate of preference #${first + 1} (${choice.name} · ${choice.branch}).` })
    else seen.set(key, index)
  })
  return warnings
}

export function simulateAllotment(
  choices: SimulatorChoice[],
  percentile: number
): { allottedIndex: number; choice: SimulatorChoice } | null {
  const index = choices.findIndex((c) => percentile >= c.cutoff)
  return index === -1 ? null : { allottedIndex: index, choice: choices[index] }
}
