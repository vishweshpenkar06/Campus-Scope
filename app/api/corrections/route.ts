import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { allow, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const schema = z.object({
  collegeId: z.coerce.number().int().positive().optional(),
  cutoffId: z.coerce.number().int().positive().optional(),
  message: z.string().trim().min(10).max(1000),
})

export async function POST(request: Request) {
  if (!(await allow(`corrections:${clientIp(request)}`, 5))) {
    return Response.json({ error: 'Too many reports — try again in a minute.' }, { status: 429 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Describe the correction in at least 10 characters.' }, { status: 400 })
  }
  try {
    const row = await prisma.correctionRequest.create({
      data: parsed.data,
      select: { id: true },
    })
    return Response.json({ data: row }, { status: 201 })
  } catch {
    return Response.json({ error: 'The correction queue is unavailable right now.' }, { status: 503 })
  }
}
