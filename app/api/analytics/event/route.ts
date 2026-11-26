import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { allow, clientIp } from '@/lib/rate-limit'

// public fire-and-forget telemetry sink; no PII beyond what clients choose to send
const eventSchema = z.object({
  type: z.enum(['search', 'simulator', 'docs', 'ask', 'predict', 'share', 'referral', 'alerts']),
  label: z.string().trim().min(1).max(60),
  value: z.coerce.number().int().min(0).max(100).default(0),
})

export async function POST(request: Request) {
  if (!allow(`analytics:${clientIp(request)}`, 30)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }
  const parsed = eventSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid event' }, { status: 400 })
  try {
    await prisma.analyticsEvent.create({ data: parsed.data })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Unavailable' }, { status: 500 })
  }
}
