import { prisma } from '@/lib/prisma'
import { runCutoffSync } from '@/lib/cron-sync'
import { logEvent } from '@/lib/telemetry'

// External cron (any scheduler) hits this with `Authorization: Bearer $CRON_SECRET`
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await runCutoffSync(prisma)
    logEvent('cron', 'sync-cutoffs', result.staged + result.trendsUpdated + result.cutoffsUpdated + result.noticesCreated)
    return Response.json({ data: { ...result, ranAt: new Date().toISOString() } })
  } catch {
    return Response.json({ error: 'Sync failed' }, { status: 500 })
  }
}
