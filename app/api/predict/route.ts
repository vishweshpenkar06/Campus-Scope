import { NextResponse } from 'next/server'
import { z } from 'zod'

const inputSchema = z.object({
  rank: z.coerce.number().int().min(1).max(100000),
  budget: z.coerce.number().min(1).max(100),
  location: z.string().trim().max(80).optional().default(''),
})

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid rank and annual budget.' }, { status: 400 })
    const { rank, budget, location } = parsed.data
    const selectivity = Math.min(1, Math.max(0, (100000 - rank) / 100000))
    const budgetFit = Math.min(1, budget / 12)
    const locationFit = location ? 0.08 : 0
    const score = Math.round((selectivity * 0.55 + budgetFit * 0.35 + locationFit) * 100)
    const band = score >= 70 ? 'Strong match' : score >= 45 ? 'Worth exploring' : 'Stretch shortlist'
    return NextResponse.json({ data: { score: Math.min(94, Math.max(18, score)), band, assumptions: ['Rank is treated as a general entrance rank.', 'Budget is annual tuition in lakhs.', 'This is a directional shortlist signal, not an admission guarantee.'] } })
  } catch {
    return NextResponse.json({ error: 'The predictor could not process that request.' }, { status: 400 })
  }
}
