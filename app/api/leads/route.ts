import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { allow, clientIp } from '@/lib/rate-limit'
import { logEvent } from '@/lib/telemetry'

export const dynamic = 'force-dynamic'

const schema = z.object({
  counsellorId: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,18}$/, 'Enter a valid phone number'),
  percentile: z.coerce.number().min(0).max(100).optional(),
  category: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10).max(1000),
})

export async function POST(request: Request) {
  if (!allow(`leads:${clientIp(request)}`, 5)) {
    return Response.json({ error: 'Too many requests — try again in a minute.' }, { status: 429 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' },
      { status: 400 }
    )
  }

  let counsellor = null
  if (parsed.data.counsellorId) {
    counsellor = await prisma.counsellorProfile
      .findUnique({
        where: { id: parsed.data.counsellorId },
        include: { user: { select: { email: true } } },
      })
      .catch(() => null)
    if (!counsellor) return Response.json({ error: 'Counsellor not found' }, { status: 404 })
  }

  const session = await auth().catch(() => null)
  let lead
  try {
    lead = await prisma.lead.create({
      data: {
        studentId: session?.user?.id ?? null,
        counsellorId: counsellor?.id ?? null,
        name: parsed.data.name,
        phone: parsed.data.phone,
        percentile: parsed.data.percentile,
        category: parsed.data.category,
        message: parsed.data.message,
      },
      select: { id: true, status: true },
    })
  } catch {
    return Response.json({ error: 'The lead service is unavailable right now.' }, { status: 503 })
  }

  logEvent('lead', counsellor ? 'counsellor' : 'unrouted')
  const email = counsellor?.user.email
    ? await sendLeadEmail(counsellor.user.email, counsellor.displayName, parsed.data)
    : 'unrouted'

  return Response.json({ data: { ...lead, email } }, { status: 201 })
}

async function sendLeadEmail(
  to: string,
  counsellorName: string,
  lead: { name: string; phone: string; percentile?: number; category?: string; message: string }
): Promise<'sent' | 'queued' | 'failed'> {
  if (!process.env.RESEND_API_KEY) {
    // Dev fallback: never log the student's phone or message.
    console.info(`[lead] queued for ${counsellorName} — set RESEND_API_KEY to email it`)
    return 'queued'
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'CampusScope <onboarding@resend.dev>',
        to,
        subject: `New counselling request from ${sanitize(lead.name)}`,
        html: `<h2>New CampusScope lead</h2>
<p><strong>Name:</strong> ${sanitize(lead.name)}</p>
<p><strong>Phone:</strong> ${sanitize(lead.phone)}</p>
<p><strong>Percentile:</strong> ${lead.percentile ?? 'not provided'}</p>
<p><strong>Category:</strong> ${sanitize(lead.category ?? 'not provided')}</p>
<p><strong>Message:</strong></p>
<p>${sanitize(lead.message).replace(/\n/g, '<br />')}</p>
<hr /><p style="color:#666;font-size:12px">Sent by CampusScope. Reply to the student directly. Do not request OTPs or payment credentials.</p>`,
      }),
      signal: AbortSignal.timeout(8000),
    })
    return response.ok ? 'sent' : 'failed'
  } catch {
    return 'failed'
  }
}

function sanitize(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}
