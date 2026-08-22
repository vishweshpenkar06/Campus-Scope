export type ConcessionPolicy = {
  ebcConcessionPct: number
  tfwsConcessionPct: number
  scStConcessionPct: number
  minorityConcessionPct: number
}

export type IncomeBracket = 'under25L' | 'under8L' | 'above8L'

export type SchemeRow = { name: string; concessionPct: number; eligible: boolean; reason: string }

// ponytail: income gating is a coarse bracket heuristic (≤2.5L unlocks full EBC, ≤8L keeps partial)
// reflecting common state scheme caps; replace with per-scheme rules table when official criteria land.
export function schemeMatrix(category: string, income: IncomeBracket, policy: ConcessionPolicy): SchemeRow[] {
  const casteBased = category === 'SC' || category === 'ST'
  const under8 = income !== 'above8L'
  const under2_5 = income === 'under25L'

  const ebcPct = under2_5 ? policy.ebcConcessionPct : Math.round(policy.ebcConcessionPct / 2)
  return [
    {
      name: 'TFWS Tuition Waiver',
      concessionPct: policy.tfwsConcessionPct,
      eligible: under8,
      reason: under8 ? '' : 'Family income must be under ₹8 LPA',
    },
    {
      name: 'EBC Scholarship',
      concessionPct: ebcPct,
      eligible: under8 && category !== 'SC' && category !== 'ST',
      reason: !under8 ? 'Family income must be under ₹8 LPA' : casteBased ? 'EBC applies to OPEN/OBC candidates' : '',
    },
    {
      name: 'SC/ST Fee Reimbursement',
      concessionPct: policy.scStConcessionPct,
      eligible: casteBased,
      reason: casteBased ? '' : 'Requires SC/ST category',
    },
    {
      name: 'Minority Scholarship',
      concessionPct: policy.minorityConcessionPct,
      eligible: under8,
      reason: under8 ? '' : 'Family income must be under ₹8 LPA',
    },
  ]
}

// Only the single best applicable waiver applies — concessions do not stack.
export function bestNetTuitionPerYear(annualTuition: number, rows: SchemeRow[]): number {
  const best = Math.max(0, ...rows.filter((r) => r.eligible).map((r) => r.concessionPct))
  return Math.round(annualTuition * (1 - best / 100))
}
