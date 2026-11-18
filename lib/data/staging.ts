import { createHash } from 'node:crypto'
import type { Prisma, PrismaClient } from '@prisma/client'
import { matchCollege } from './match'
import { normalizeCutoff, normalizeDate, type RawCutoff } from './normalize'
import { canApprove } from './provenance'

export type StageInput = {
  sourceName: string
  sourceUrl: string
  license?: string
  records: RawCutoff[]
}

export type StageResult = {
  sourceId: number
  staged: number
  duplicates: number
  unmatched: number
  invalid: number
}

export type StagingPayload = {
  kind: 'cutoff' | 'trend' | 'seat' | 'placement'
  collegeId?: number
  collegeName: string
  branch: string
  category: string
  capRound: number
  exam: 'CET' | 'JEE'
  percentile: number
  year: number
  sourceUrl: string
  sourceName: string
  sourceDate: string | null
  matchScore?: number
  fixture?: boolean
  [key: string]: unknown
}

export async function stageRecords(prisma: PrismaClient, input: StageInput): Promise<StageResult> {
  const source = await prisma.dataSource.upsert({
    where: { name: input.sourceName },
    update: {
      url: input.sourceUrl,
      license: input.license ?? undefined,
      lastRunAt: new Date(),
      ...(input.sourceName.startsWith('fixture') ? { status: 'inactive' } : {}),
    },
    create: {
      name: input.sourceName,
      url: input.sourceUrl,
      license: input.license,
      lastRunAt: new Date(),
      // Fixture sources must never be picked up by the cron sync.
      status: input.sourceName.startsWith('fixture') ? 'inactive' : 'active',
    },
  })

  const colleges = await prisma.college.findMany({ select: { id: true, name: true } })
  const result: StageResult = {
    sourceId: source.id,
    staged: 0,
    duplicates: 0,
    unmatched: 0,
    invalid: 0,
  }

  for (const record of input.records) {
    const normalized = normalizeCutoff({
      ...record,
      sourceName: record.sourceName ?? input.sourceName,
      sourceUrl: record.sourceUrl ?? input.sourceUrl,
    })

    if (!normalized.ok) {
      result.invalid++
      await upsertRecord(prisma, source.id, record, {
        status: 'rejected',
        reason: normalized.error,
        payload: { kind: record.kind ?? 'cutoff', error: normalized.error, raw: record },
      })
      continue
    }

    const value = normalized.value
    const match = matchCollege(value.collegeName, colleges)
    if (!match) result.unmatched++

    const payload: StagingPayload = {
      kind: record.kind ?? 'cutoff',
      collegeId: match?.college.id,
      collegeName: value.collegeName,
      branch: value.branch,
      category: value.category,
      capRound: value.capRound,
      exam: value.exam,
      percentile: value.percentile,
      year: value.year,
      sourceUrl: value.sourceUrl,
      sourceName: value.sourceName,
      sourceDate: value.sourceDate ? value.sourceDate.toISOString() : null,
      matchScore: match?.score,
      fixture: input.sourceName.startsWith('fixture'),
    }

    const externalId = hashPayload(payload)
    const created = await upsertRecord(prisma, source.id, record, {
      status: 'pending',
      reason: match ? null : 'No college match — review manually',
      payload,
      externalId,
    })
    if (created) result.staged++
    else result.duplicates++
  }

  return result
}

async function upsertRecord(
  prisma: PrismaClient,
  sourceId: number,
  record: RawCutoff,
  data: { status: string; reason: string | null; payload: unknown; externalId?: string }
): Promise<boolean> {
  const externalId =
    data.externalId ??
    hashPayload({ ...record, sourceId, invalid: data.reason ?? 'invalid' })

  const existing = await prisma.stagingRecord.findUnique({
    where: { sourceId_externalId: { sourceId, externalId } },
    select: { id: true },
  })
  if (existing) return false

  await prisma.stagingRecord.create({
    data: {
      sourceId,
      externalId,
      rawJson: data.payload as Prisma.InputJsonValue,
      status: data.status,
      reason: data.reason,
      reviewedAt: data.status === 'pending' ? null : new Date(),
    },
  })
  return true
}

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32)
}

export async function applyStagingRecord(
  prisma: PrismaClient,
  id: number,
  reviewer: string,
  edits?: Record<string, unknown>
): Promise<{ kind: string; recordId: number }> {
  const staged = await prisma.stagingRecord.findUnique({
    where: { id },
    include: { source: true },
  })
  if (!staged) throw new Error('Staging record not found')

  const payload = { ...(staged.rawJson as unknown as StagingPayload), ...(edits ?? {}) }
  canApprove({ status: staged.status, rawJson: payload })
  if (!payload.collegeId) throw new Error('No college match. Edit the record to select a college first.')

  const provenance = {
    // The registry URL is authoritative; a staged payload cannot inject an
    // unrelated "official" link at approval time.
    sourceUrl: staged.source.url,
    sourceName: staged.source.name,
    sourceDate: normalizeDate(payload.sourceDate),
    verifiedAt: new Date(),
    verifiedBy: reviewer,
    confidence: payload.sourceDate ? 1 : 0.8,
  }

  await prisma.$transaction(async (tx) => {
    const kind = payload.kind ?? 'cutoff'
    if (kind === 'cutoff') {
      const existing = await tx.cutoff.findFirst({
        where: {
          collegeId: payload.collegeId!,
          exam: payload.exam,
          year: payload.year,
          category: payload.category,
          branch: payload.branch,
          capRound: payload.capRound,
        },
        select: { id: true },
      })
      if (existing) {
        await tx.cutoff.update({
          where: { id: existing.id },
          data: { percentile: payload.percentile, ...provenance },
        })
      } else {
        await tx.cutoff.create({
          data: {
            collegeId: payload.collegeId!,
            exam: payload.exam,
            year: payload.year,
            category: payload.category,
            branch: payload.branch,
            capRound: payload.capRound,
            percentile: payload.percentile,
            ...provenance,
          },
        })
      }
    } else if (kind === 'trend') {
      await tx.capRoundTrend.upsert({
        where: {
          collegeId_year_exam_category_branch: {
            collegeId: payload.collegeId!,
            year: payload.year,
            exam: payload.exam,
            category: payload.category,
            branch: payload.branch,
          },
        },
        update: {
          round1Cutoff: numberField(payload, 'round1Cutoff', payload.percentile),
          round2Cutoff: numberField(payload, 'round2Cutoff', payload.percentile),
          round3Cutoff: numberField(payload, 'round3Cutoff', payload.percentile),
          spotRoundCutoff: payload.spotRoundCutoff === null ? null : Number(payload.spotRoundCutoff ?? payload.percentile),
          ...provenance,
        },
        create: {
          collegeId: payload.collegeId!,
          year: payload.year,
          exam: payload.exam,
          category: payload.category,
          branch: payload.branch,
          round1Cutoff: numberField(payload, 'round1Cutoff', payload.percentile),
          round2Cutoff: numberField(payload, 'round2Cutoff', payload.percentile),
          round3Cutoff: numberField(payload, 'round3Cutoff', payload.percentile),
          spotRoundCutoff: payload.spotRoundCutoff === null ? null : Number(payload.spotRoundCutoff ?? payload.percentile),
          ...provenance,
        },
      })
    } else if (kind === 'seat') {
      const seats = {
        totalSeats: numberField(payload, 'totalSeats', 0),
        openSeats: numberField(payload, 'openSeats', 0),
        obcSeats: numberField(payload, 'obcSeats', 0),
        scSeats: numberField(payload, 'scSeats', 0),
        stSeats: numberField(payload, 'stSeats', 0),
        tfwsSeats: numberField(payload, 'tfwsSeats', 0),
        allIndiaSeats: numberField(payload, 'allIndiaSeats', 0),
      }
      await tx.seatMatrix.upsert({
        where: { collegeId_branch: { collegeId: payload.collegeId!, branch: payload.branch } },
        update: { ...seats, ...provenance },
        create: { collegeId: payload.collegeId!, branch: payload.branch, ...seats, ...provenance },
      })
    } else if (kind === 'placement') {
      const existing = await tx.placement.findFirst({
        where: { collegeId: payload.collegeId!, year: payload.year },
        select: { id: true },
      })
      const values = {
        avgPackage: numberField(payload, 'avgPackage', 0),
        highestPackage: numberField(payload, 'highestPackage', 0),
        placementRate: numberField(payload, 'placementRate', 0),
        ...provenance,
      }
      if (existing) {
        await tx.placement.update({ where: { id: existing.id }, data: values })
      } else {
        await tx.placement.create({
          data: { collegeId: payload.collegeId!, year: payload.year, ...values },
        })
      }
    } else {
      throw new Error(`Unknown staging kind: ${kind}`)
    }

    await tx.stagingRecord.update({
      where: { id },
      data: {
        status: 'approved',
        reason: null,
        reviewedAt: new Date(),
        rawJson: payload as Prisma.InputJsonValue,
      },
    })
  })

  return { kind: payload.kind ?? 'cutoff', recordId: id }
}

export async function rejectStagingRecord(
  prisma: PrismaClient,
  id: number,
  reason: string
): Promise<void> {
  const staged = await prisma.stagingRecord.findUnique({ where: { id }, select: { status: true } })
  if (!staged) throw new Error('Staging record not found')
  if (staged.status !== 'pending') throw new Error(`Record is already ${staged.status}`)
  await prisma.stagingRecord.update({
    where: { id },
    data: { status: 'rejected', reason: reason || 'Rejected by reviewer', reviewedAt: new Date() },
  })
}

function numberField(payload: StagingPayload, key: string, fallback: number): number {
  const value = Number(payload[key])
  return Number.isFinite(value) ? value : fallback
}
