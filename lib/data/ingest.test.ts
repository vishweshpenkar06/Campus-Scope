import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { extractRecords } from '../../scripts/ingest/extract'
import { buildIngestReport } from '../../scripts/ingest/report'

const fixtureDir = resolve('scripts/ingest/fixtures')

describe('ingestion fixture', () => {
  test('parses 100 rows and matches at least 95%', async () => {
    const bytes = new Uint8Array(await readFile(resolve(fixtureDir, 'dte-2025.json')))
    const records = await extractRecords({ bytes, format: 'json' })
    const catalog = (
      JSON.parse(await readFile(resolve(fixtureDir, 'colleges.json'), 'utf8')) as Array<{
        name: string
        location: string
      }>
    ).map((college, index) => ({ id: index + 1, ...college }))

    const report = buildIngestReport(
      records,
      catalog,
      'https://example.invalid/fixture-dte-2025/cutoffs.json'
    )

    expect(report.parsed).toBe(100)
    expect(report.valid).toBe(100)
    expect(report.invalid).toBe(0)
    expect(report.matched).toBe(95)
    expect(report.matchRate).toBeGreaterThanOrEqual(95)
    expect(report.unmatched).toBe(5)
    expect(report.published).toBe(false)
  })

  test('CSV and pipe-delimited sources follow the same normalization', async () => {
    const csv = [
      'college,branch,category,round,exam,percentile,year,sourceUrl',
      'COEP College of Engineering,COMP,open,CAP Round 2,MHT CET,91.25,2025,https://example.invalid/a.csv',
    ].join('\n')
    const records = await extractRecords({ text: csv, format: 'csv' })
    const report = buildIngestReport(
      records,
      [{ id: 1, name: 'COEP Technological University' }],
      'https://example.invalid/a.csv'
    )
    expect(report.valid).toBe(1)
    expect(report.matched).toBe(1)

    const pipe = 'Saraswati College of Engineering|IT|OBC|1|88.4|2025|JEE'
    const pipeRecords = await extractRecords({ text: pipe, format: 'text' })
    expect(pipeRecords[0].college).toContain('Saraswati')
  })

  test('a row without a source URL cannot enter the pipeline', async () => {
    const records = await extractRecords({
      text: JSON.stringify([
        { college: 'COEP', branch: 'CSE', category: 'OPEN', round: 1, percentile: 90, year: 2025 },
      ]),
      format: 'json',
    })
    const report = buildIngestReport(records, [{ id: 1, name: 'COEP Technological University' }], '')
    expect(report.valid).toBe(0)
    expect(report.invalid).toBe(1)
    expect(report.sampleErrors[0]).toMatch(/source URL/)
  })
})
