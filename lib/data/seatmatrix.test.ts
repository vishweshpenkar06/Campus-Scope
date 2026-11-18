import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { parseSeatMatrixText } from '../../scripts/ingest/seatmatrix'

const fixture = readFileSync(resolve('scripts/ingest/fixtures/seatmatrix-2026-page1.txt'), 'utf8')

describe('seat matrix parser', () => {
  test('parses official sanctioned intake and quota split', () => {
    const rows = parseSeatMatrixText(fixture)
    expect(rows.length).toBeGreaterThan(0)
    const civil = rows.find((row) => row.branch === 'Civil Engineering')
    expect(civil).toMatchObject({
      instituteCode: '01002',
      branchCode: '0100219110',
      sanctionIntake: 60,
      openSeats: 22,
      obcSeats: 9,
      scSeats: 8,
      stSeats: 4,
      tfwsSeats: 3,
    })
    expect(civil!.openSeats + civil!.obcSeats + civil!.scSeats + civil!.stSeats).toBeLessThanOrEqual(
      civil!.sanctionIntake
    )
  })
})
