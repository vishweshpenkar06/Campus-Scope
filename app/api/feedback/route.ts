import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { allow, clientIp } from '@/lib/rate-limit'
import { logEvent } from '@/lib/telemetry'

export const dynamic = 'force-dynamic'

const schema = z.object({
  page: z.string().trim().max(160).default(''),
  rating: z.coerce.number().int().min(1).max(5).nullish(),
  message: z.string().trim().min(5).max(1000),
  email: z.string().trim().email().max(120).optional(),
})

export async function POST(request: Request) {
  if (!(await allow(`feedback:${clientIp(request)}`, 5))) {
    return Response.json({ error: 'Too many submissions — try again in a minute.' }, { status: 429 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Check the feedback.' }, { status: 400 })
  }

  logEvent('feedback', parsed.data.page || 'unknown')
  try {
    const feedback = await prisma.feedback.create({
      data: {
        page: parsed.data.page,
        rating: parsed.data.rating ?? null,
        message: parsed.data.message,
        email: parsed.data.email ?? null,
      },
      select: { id: true },
    })
    return Response.json({ data: feedback }, { status: 201 })
  } catch {
    return Response.json({ error: 'Feedback is unavailable right now.' }, { status: 503 })
  }
}
