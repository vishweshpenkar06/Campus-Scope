import { prisma } from '@/lib/prisma'
import { logEvent } from '@/lib/telemetry'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [prefs, deadlines, recentCutoffs] = await Promise.all([
      prisma.alertPreference.findMany({ where: { active: true }, select: { id: true, channel: true } }),
      prisma.admissionDeadline.count({ where: { eventDate: { gte: new Date() } } }),
      prisma.cutoff.count({ where: { verifiedAt: { gte: new Date(Date.now() - 86_400_000) } } }),
    ])

    if (!prefs.length || (!deadlines && !recentCutoffs)) {
      return Response.json({ data: { sent: 0, reasons: 0, ranAt: new Date().toISOString() } })
    }

    const emailCount = prefs.filter((pref) => pref.channel === 'email').length
    const whatsappCount = prefs.length - emailCount
    logEvent('alerts', 'digest', prefs.length)
    return Response.json({
      data: {
        recipients: prefs.length,
        emailCount,
        whatsappCount,
        deadlines,
        recentCutoffs,
        ranAt: new Date().toISOString(),
      },
    })
  } catch {
    return Response.json({ error: 'Alert digest failed' }, { status: 500 })
  }
}
