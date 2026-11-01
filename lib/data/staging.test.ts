import type { PrismaClient } from '@prisma/client'
import { describe, expect, test } from 'vitest'
import { applyStagingRecord, rejectStagingRecord } from './staging'

const staged = {
  id: 7,
  sourceId: 2,
  externalId: 'abc',
  status: 'pending',
  reason: null,
  rawJson: {
    kind: 'cutoff',
    collegeId: 11,
    collegeName: 'COEP',
    branch: 'Computer Engineering',
    category: 'OPEN',
    capRound: 2,
    exam: 'CET',
    percentile: 91.25,
    year: 2025,
    sourceUrl: 'https://example.gov.in/ignored.pdf',
    sourceName: 'fixture',
    sourceDate: '2025-09-15T00:00:00.000Z',
  },
  createdAt: new Date(),
  reviewedAt: null,
  source: { name: 'DTE 2025', url: 'https://cetcell.mahacet.org/cutoffs.pdf' },
}

function fakePrisma(created: Record<string, unknown> | null, updated: Record<string, unknown> | null) {
  const tx = {
    cutoff: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (created) Object.assign(created, data)
      },
      update: async () => {},
    },
    capRoundTrend: { upsert: async () => {} },
    seatMatrix: { upsert: async () => {} },
    placement: { findFirst: async () => null, create: async () => {}, update: async () => {} },
    stagingRecord: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        if (updated) Object.assign(updated, data)
      },
    },
  }
  return {
    stagingRecord: {
      findUnique: async () => staged,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        if (updated) Object.assign(updated, data)
      },
    },
    $transaction: async (callback: (client: typeof tx) => Promise<void>) => callback(tx),
  } as unknown as PrismaClient
}

describe('staging review', () => {
  test('approving writes a verified row with registry provenance', async () => {
    const created: Record<string, unknown> = {}
    const updated: Record<string, unknown> = {}
    const result = await applyStagingRecord(fakePrisma(created, updated), 7, 'admin@campusscope.test')

    expect(result.kind).toBe('cutoff')
    expect(created.percentile).toBe(91.25)
    expect(created.sourceUrl).toBe('https://cetcell.mahacet.org/cutoffs.pdf')
    expect(created.sourceName).toBe('DTE 2025')
    expect(created.verifiedBy).toBe('admin@campusscope.test')
    expect(created.verifiedAt).toBeInstanceOf(Date)
    expect(created.confidence).toBe(1)
    expect(updated.status).toBe('approved')
  })

  test('rejecting only changes the staging row', async () => {
    const updated: Record<string, unknown> = {}
    const prisma = {
      stagingRecord: {
        findUnique: async () => ({ status: 'pending' }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          Object.assign(updated, data)
        },
      },
    } as unknown as PrismaClient

    await rejectStagingRecord(prisma, 7, 'source row does not match')
    expect(updated.status).toBe('rejected')
    expect(updated.reason).toBe('source row does not match')
  })

  test('an already-reviewed row cannot be approved twice', async () => {
    const prisma = {
      stagingRecord: { findUnique: async () => ({ ...staged, status: 'approved' }) },
    } as unknown as PrismaClient
    await expect(applyStagingRecord(prisma, 7, 'admin@campusscope.test')).rejects.toThrow(/already approved/)
  })
})
