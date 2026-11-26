import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { allow, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const schema = z
  .object({
    identifier: z.string().trim().min(5).max(160),
    channel: z.enum(['email', 'whatsapp']),
    types: z.array(z.enum(['deadline', 'cutoff', 'spot'])).min(1).max(3),
    consent: z.literal(true),
    action: z.enum(['subscribe', 'unsubscribe']).default('subscribe'),
  })
  .superRefine((value, context) => {
    if (value.action === 'subscribe' && value.channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.identifier)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid email address.' })
    }
    if (value.action === 'subscribe' && value.channel === 'whatsapp' && !/^\+?[0-9\s-]{10,18}$/.test(value.identifier)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid phone number.' })
    }
  })

export async function POST(request: Request) {
  if (!allow(`alerts:${clientIp(request)}`, 5)) {
    return Response.json({ error: 'Too many requests — try again in a minute.' }, { status: 429 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Check the form.' }, { status: 400 })
  }

  const { identifier, channel, types, action } = parsed.data
  try {
    if (action === 'unsubscribe') {
      await prisma.alertPreference.deleteMany({ where: { identifier } })
      return Response.json({ ok: true, status: 'unsubscribed' })
    }
    await prisma.alertPreference.upsert({
      where: { identifier },
      update: { channel, types: types.join(','), active: true },
      create: { identifier, channel, types: types.join(',') },
    })
    return Response.json({ ok: true, status: 'subscribed' })
  } catch {
    return Response.json({ error: 'Alert preferences are unavailable right now.' }, { status: 503 })
  }
}
