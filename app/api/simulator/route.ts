import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const PUBLIC_CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }

import { logEvent } from '@/lib/telemetry'
import { errorResponse } from '@/lib/validation'

const querySchema = z.object({
  exam: z.enum(['JEE', 'CET']).default('CET'),
  category: z.string().trim().min(1).max(20).default('OPEN'),
})

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const parsed = querySchema.safeParse({ exam: params.get('exam') ?? undefined, category: params.get('category') ?? undefined })
  if (!parsed.success) return errorResponse('Invalid exam/category', 400, parsed.error.flatten())

  logEvent('simulator', `${parsed.data.exam}/${parsed.data.category}`)

  try {
    // latest round's closing cutoff per college+branch is the simulator's clearing bar
    const rows = await prisma.capRoundTrend.findMany({
      where: { exam: parsed.data.exam, category: parsed.data.category, year: { gt: 2020 } },
      orderBy: [{ year: 'desc' }, { spotRoundCutoff: 'desc' }],
      include: { college: { select: { id: true, name: true, location: true } } },
    })

    const seen = new Set<string>()
    const data = rows
      .filter((r) => {
        const key = `${r.collegeId}|${r.branch}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((r) => ({
        collegeId: r.collegeId,
        name: r.college.name,
        location: r.college.location,
        branch: r.branch,
        cutoff: r.spotRoundCutoff ?? r.round3Cutoff,
        year: r.year,
      }))

    return Response.json({ data }, { headers: PUBLIC_CACHE })
  } catch {
    return Response.json({ data: [], source: 'unavailable' }, { headers: PUBLIC_CACHE })
  }
}
