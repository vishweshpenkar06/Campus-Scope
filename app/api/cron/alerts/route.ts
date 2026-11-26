import { prisma } from '@/lib/prisma'
import { logEvent } from '@/lib/telemetry'
import { sendAlertEmail } from '@/lib/notifications/email'

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
      prisma.alertPreference.findMany({ where: { active: true }, select: { id: true, channel: true, identifier: true } }),
      prisma.admissionDeadline.count({ where: { eventDate: { gte: new Date() } } }),
      prisma.cutoff.count({ where: { verifiedAt: { gte: new Date(Date.now() - 86_400_000) } } }),
    ])

    if (!prefs.length || (!deadlines && !recentCutoffs)) {
      return Response.json({ data: { sent: 0, reasons: 0, ranAt: new Date().toISOString() } })
    }

    const emailPrefs = prefs.filter((pref) => pref.channel === 'email')
    const whatsappCount = prefs.length - emailPrefs.length
    const lines = [
      `${deadlines} upcoming admission deadline(s) on record.`,
      `${recentCutoffs} cutoff row(s) verified in the last 24 hours.`,
      'Open CampusScope to check your shortlist and the official CET Cell portal.',
    ]
    const results = await Promise.all(
      emailPrefs.map((pref) =>
        sendAlertEmail(pref.identifier, 'CampusScope admissions update', lines)
      )
    )
    const sent = results.filter((result) => result === 'sent').length
    const failed = results.filter((result) => result === 'failed').length
    const queued = results.filter((result) => result === 'queued').length + whatsappCount
    logEvent('alerts', 'digest', sent + queued)

    return Response.json({
      data: {
        recipients: prefs.length,
        sent,
        queued,
        failed,
        deadlines,
        recentCutoffs,
        ranAt: new Date().toISOString(),
      },
    })
  } catch {
    return Response.json({ error: 'Alert digest failed' }, { status: 500 })
  }
}
