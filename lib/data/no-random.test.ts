import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { PrismaClient } from '@prisma/client'
import { describe, expect, test } from 'vitest'
import { SYNC_COOLDOWN_MS, runCutoffSync, shouldRunSync } from '../cron-sync'

function walk(path: string): string[] {
  return readdirSync(path).flatMap((entry) => {
    const full = join(path, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

describe('no simulated production data', () => {
  test('data paths never call the random generator', () => {
    const files = ['lib/cron-sync.ts', ...walk('lib/data')].filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.test.ts')
    )
    for (const file of files) {
      const forbidden = new RegExp('Math\\.' + 'random')
      expect(readFileSync(file, 'utf8'), `${file} must be deterministic`).not.toMatch(forbidden)
    }
  })

  test('sync cooldown is deterministic', () => {
    const now = new Date('2026-11-01T12:00:00Z')
    expect(shouldRunSync(null, now)).toBe(true)
    expect(shouldRunSync(new Date(now.getTime() - SYNC_COOLDOWN_MS + 1), now)).toBe(false)
    expect(shouldRunSync(new Date(now.getTime() - SYNC_COOLDOWN_MS), now)).toBe(true)
  })

  test('no active source means zero changes', async () => {
    const fake = {
      dataSource: { findFirst: async () => null },
    } as unknown as PrismaClient
    expect(await runCutoffSync(fake)).toEqual({
      trendsUpdated: 0,
      cutoffsUpdated: 0,
      noticesCreated: 0,
      staged: 0,
    })
  })
})
