import { PrismaClient } from '@prisma/client'

export type SyncResult = {
  trendsUpdated: number
  cutoffsUpdated: number
  noticesCreated: number
}

// ponytail: simulated upstream — a real pipeline would pull DTE/JoSAA feeds; the diff-and-upsert
// shape (small batches, per-row updates, no long transaction) is what we actually want to keep.
// ponytail: module-level round-robin cursor — resets per serverless instance, which is fine for a
// best-effort sync; persist to DB if exact continuation ever matters.
let syncCursor = 0

export async function runCutoffSync(prisma: PrismaClient): Promise<SyncResult> {
  const result: SyncResult = { trendsUpdated: 0, cutoffsUpdated: 0, noticesCreated: 0 }

  // round-robin over colleges keeps each run cheap and avoids hammering one slice of the table
  const maxId = await prisma.college.aggregate({ _max: { id: true } })
  const cursor = syncCursor % Math.max(1, maxId._max.id ?? 1)
  const batch = await prisma.college.findMany({
    where: { id: { gt: cursor } },
    orderBy: { id: 'asc' },
    take: 6,
    include: { capRoundTrends: { where: { year: 2025 }, take: 4 } },
  })
  syncCursor = batch.at(-1)?.id ?? 0

  for (const college of batch) {
    if (!college.capRoundTrends.length) continue

    // simulate upstream drift: cutoffs close slightly lower as rounds settle
    const drift = () => Math.round((Math.random() * 0.3 - 0.15) * 100) / 100
    for (const trend of college.capRoundTrends) {
      await prisma.capRoundTrend.update({
        where: { id: trend.id },
        data: {
          round2Cutoff: clamp(trend.round2Cutoff + drift()),
          round3Cutoff: clamp(trend.round3Cutoff + drift()),
          spotRoundCutoff: trend.spotRoundCutoff === null ? null : clamp(trend.spotRoundCutoff + drift()),
        },
      })
      result.trendsUpdated++
    }

    // mirror the same drift onto matching Cutoff rows (same college/branch/exam/category)
    const sample = college.capRoundTrends[0]
    const updatedCutoffs = await prisma.cutoff.updateMany({
      where: {
        collegeId: college.id,
        branch: sample.branch,
        exam: sample.exam,
        category: sample.category,
        capRound: { in: [2, 3] },
      },
      data: { percentile: { decrement: 0.05 } },
    })
    result.cutoffsUpdated += updatedCutoffs.count

    // keep exactly one open spot notice per college — refresh deadline instead of piling duplicates
    const openNotice = await prisma.spotRoundNotice.findFirst({
      where: { collegeId: college.id, applicationDeadline: { gte: new Date() } },
    })
    if (!openNotice) {
      await prisma.spotRoundNotice.create({
        data: {
          collegeId: college.id,
          branch: sample.branch,
          vacancyCount: 2 + Math.floor(Math.random() * 8),
          applicationDeadline: new Date(Date.now() + (5 + Math.floor(Math.random() * 6)) * 86400000),
          publishedAt: new Date(),
        },
      })
      result.noticesCreated++
    }
  }

  // notify everyone tracking a touched college — dedupeKey keeps it to one ping per day
  const touchedIds = [...new Set(batch.filter((c) => c.capRoundTrends.length).map((c) => c.id))]
  if (touchedIds.length) {
    const watchers = await prisma.savedCollege.findMany({
      where: { collegeId: { in: touchedIds } },
      select: { userId: true, collegeId: true },
    })
    const nameById = new Map(batch.map((c) => [c.id, c.name]))
    const today = new Date().toISOString().slice(0, 10)
    const notifications = watchers.map((w) => ({
      userId: w.userId,
      title: 'Cutoff & vacancy update',
      message: `${nameById.get(w.collegeId) ?? 'A saved college'} just refreshed its CAP cutoffs${result.noticesCreated ? ' — check open spot rounds' : ''}.`,
      type: 'cutoff',
      dedupeKey: `sync:${w.collegeId}:${today}`,
    }))
    await prisma.notification.createMany({ data: notifications, skipDuplicates: true })
  }

  return result
}

function clamp(value: number) {
  return Math.round(Math.max(30, Math.min(99.9, value)) * 100) / 100
}
