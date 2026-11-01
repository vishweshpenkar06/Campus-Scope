import type { PrismaClient } from '@prisma/client'
import { detectFormat, extractRecords } from '@/scripts/ingest/extract'
import { fetchSource } from '@/scripts/ingest/fetch'
import { stageRecords } from '@/lib/data/staging'

export type SyncResult = {
  trendsUpdated: number
  cutoffsUpdated: number
  noticesCreated: number
  staged: number
}

export const SYNC_COOLDOWN_MS = 6 * 60 * 60 * 1000

export function shouldRunSync(lastRunAt: Date | null, now = new Date()): boolean {
  if (!lastRunAt) return true
  return now.getTime() - lastRunAt.getTime() >= SYNC_COOLDOWN_MS
}

// Deterministic replacement for the old simulated drift. A sync never mutates
// published numbers; it fetches the registered official source and stages rows
// for human review. No source, no network, or a cooldown means updated: 0.
export async function runCutoffSync(prisma: PrismaClient): Promise<SyncResult> {
  const empty: SyncResult = { trendsUpdated: 0, cutoffsUpdated: 0, noticesCreated: 0, staged: 0 }

  const source = await prisma.dataSource.findFirst({
    where: { status: 'active' },
    orderBy: [{ lastRunAt: 'asc' }, { id: 'asc' }],
  })
  if (!source?.url?.startsWith('http')) return empty
  if (!shouldRunSync(source.lastRunAt)) return empty

  const fetched = await fetchSource(source.url)
  const format = detectFormat(fetched.contentType, source.url)
  const records = await extractRecords({ bytes: fetched.bytes, format })
  if (!records.length) return empty

  const result = await stageRecords(prisma, {
    sourceName: source.name,
    sourceUrl: source.url,
    license: source.license ?? undefined,
    records,
  })

  // Published tables change only after /admin/ingest approval, never here.
  return { ...empty, staged: result.staged }
}
