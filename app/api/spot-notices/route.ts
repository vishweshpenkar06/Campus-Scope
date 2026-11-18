import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const PUBLIC_CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }


const querySchema = z.object({
  branch: z.string().trim().max(120).optional(),
})

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({ branch: new URL(request.url).searchParams.get('branch') ?? undefined })
  if (!parsed.success) return Response.json({ error: 'Invalid filters' }, { status: 400 })

  try {
    const data = await prisma.spotRoundNotice.findMany({
      where: {
        applicationDeadline: { gte: new Date() },
        ...(parsed.data.branch ? { branch: { contains: parsed.data.branch, mode: 'insensitive' } } : {}),
      },
      orderBy: { applicationDeadline: 'asc' },
      take: 50,
      include: { college: { select: { id: true, name: true, location: true } } },
    })
    return Response.json({ data }, { headers: PUBLIC_CACHE })
  } catch {
    // feed degrades silently — same policy as the deadline banner
    return Response.json({ data: [], source: 'unavailable' }, { headers: PUBLIC_CACHE })
  }
}
