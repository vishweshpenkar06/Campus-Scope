import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PROBABILITY_MODEL_VERSION, roundChances } from '../lib/probability'

type TrendRow = {
  collegeId: number
  collegeName: string
  branch: string
  category: string
  exam: string
  year: number
  round1Cutoff: number
  round2Cutoff: number
  round3Cutoff: number
  spotRoundCutoff: number | null
}

type Observation = { predicted: number; actual: 0 | 1 }

const db = process.argv.includes('--db')

async function loadRows(): Promise<{ rows: TrendRow[]; source: string }> {
  if (!db) {
    const fixture = JSON.parse(
      await readFile(resolve('scripts/fixtures/backtest.json'), 'utf8')
    ) as { rows: TrendRow[]; note: string }
    return { rows: fixture.rows, source: `synthetic fixture — ${fixture.note}` }
  }

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const trends = await prisma.capRoundTrend.findMany({
      include: { college: { select: { name: true } } },
      orderBy: [{ year: 'desc' }, { collegeId: 'asc' }],
    })
    return {
      rows: trends.map((row) => ({
        collegeId: row.collegeId,
        collegeName: row.college.name,
        branch: row.branch,
        category: row.category,
        exam: row.exam,
        year: row.year,
        round1Cutoff: row.round1Cutoff,
        round2Cutoff: row.round2Cutoff,
        round3Cutoff: row.round3Cutoff,
        spotRoundCutoff: row.spotRoundCutoff,
      })),
      source: 'production database (CapRoundTrend)',
    }
  } finally {
    await prisma.$disconnect()
  }
}

function candidates(row: TrendRow): number[] {
  const values = [
    row.round1Cutoff + 1,
    row.round1Cutoff,
    row.round2Cutoff,
    (row.round1Cutoff + row.round3Cutoff) / 2,
    row.round3Cutoff,
    row.round3Cutoff - 1,
    row.round3Cutoff - 2,
  ]
  return [...new Set(values.filter((value) => value >= 0 && value <= 100).map((v) => Math.round(v * 100) / 100))]
}

function metrics(observations: Observation[]) {
  const epsilon = 1e-6
  const brier = observations.reduce((sum, o) => sum + (o.predicted - o.actual) ** 2, 0) / observations.length
  const logLoss =
    observations.reduce(
      (sum, o) =>
        sum +
        -(o.actual * Math.log(Math.min(1 - epsilon, Math.max(epsilon, o.predicted))) +
          (1 - o.actual) * Math.log(Math.min(1 - epsilon, Math.max(epsilon, 1 - o.predicted)))),
      0
    ) / observations.length
  const correct = observations.filter((o) => (o.predicted >= 0.5 ? 1 : 0) === o.actual).length
  const baseRate = observations.filter((o) => o.actual === 1).length / observations.length

  const bins = Array.from({ length: 10 }, (_, index) => ({
    label: `${index * 10}–${index * 10 + 10}%`,
    count: 0,
    predicted: 0,
    actual: 0,
  }))
  for (const observation of observations) {
    const bin = bins[Math.min(9, Math.floor(observation.predicted * 10))]
    bin.count++
    bin.predicted += observation.predicted
    bin.actual += observation.actual
  }

  return {
    brier: round(brier, 4),
    logLoss: round(logLoss, 4),
    accuracy: round(correct / observations.length, 4),
    baseRate: round(baseRate, 4),
    calibration: bins.map((bin) => ({
      bucket: bin.label,
      count: bin.count,
      predicted: bin.count ? round(bin.predicted / bin.count, 3) : null,
      actual: bin.count ? round(bin.actual / bin.count, 3) : null,
    })),
  }
}

function round(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

async function main() {
  const { rows, source } = await loadRows()
  if (!rows.length) throw new Error('No historical trend rows found')

  const observations: Observation[] = []
  for (const row of rows) {
    for (const percentile of candidates(row)) {
      const predicted = roundChances(percentile, row).round3
      observations.push({ predicted, actual: percentile >= row.round3Cutoff ? 1 : 0 })
    }
  }

  const result = metrics(observations)
  const payload = {
    generatedAt: new Date().toISOString(),
    modelVersion: PROBABILITY_MODEL_VERSION,
    source,
    rows: rows.length,
    observations: observations.length,
    synthetic: !db,
    ...result,
  }

  await mkdir(resolve('docs'), { recursive: true })
  await writeFile(resolve('docs/backtest.json'), `${JSON.stringify(payload, null, 2)}\n`)

  const table = result.calibration
    .filter((row) => row.count > 0)
    .map((row) => `| ${row.bucket} | ${row.count} | ${row.predicted?.toFixed(3)} | ${row.actual?.toFixed(3)} |`)
    .join('\n')

  const markdown = `# Probability backtest

Generated ${payload.generatedAt.slice(0, 10)} · model \`${PROBABILITY_MODEL_VERSION}\`

> ${db ? 'Run against production `CapRoundTrend` rows.' : 'Proxy fixture only — **not official cutoff data**. Re-run `pnpm backtest --db` against production rows before quoting these metrics.'}

## Setup

- Trend rows: ${payload.rows}
- Candidate observations: ${payload.observations}
- Source: ${source}
- Target: did the candidate percentile clear the Round 3 closing cutoff?
- Prediction: \`roundChances(percentile, row).round3\`

## Metrics

| Metric | Value |
|---|---|
| Brier score | ${result.brier} |
| Log loss | ${result.logLoss} |
| Accuracy @ 0.5 | ${result.accuracy} |
| Observed clearance rate | ${result.baseRate} |

Lower Brier and log loss are better. Accuracy is reported for completeness; calibration is the useful signal.

## Calibration

| Predicted bucket | n | Mean predicted | Observed rate |
|---|---:|---:|---:|
${table}

## Limitations

- A trend row carries the three closing cutoffs, so the Round 3 cutoff is known when scoring. This
  measures whether the logistic curve turns the cutoff into a coherent probability, not whether the
  cutoff itself can be forecast from earlier information.
- The default source is a committed synthetic fixture used to verify the pipeline. Rerun against the
  production database for a real calibration report.
- Candidate percentiles are sampled around the cutoffs; they are not a population of real applicants.

## Reproduce

\`\`\`bash
pnpm backtest        # fixture
pnpm backtest --db   # production rows
\`\`\`
`

  await writeFile(resolve('docs/BACKTEST.md'), markdown)
  console.log(JSON.stringify({ ...payload, calibration: undefined }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
