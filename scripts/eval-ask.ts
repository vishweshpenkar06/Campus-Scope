import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseAdmissionQuery } from '../lib/ai/rules-parser'
import { citationFor } from '../lib/data/provenance'
import type { AdmissionQuery } from '../lib/ai/query'

type Case = { query: string; expected: Partial<AdmissionQuery>; tags: string[] }

const SLOT_KEYS: Array<keyof AdmissionQuery> = [
  'intent',
  'exam',
  'percentile',
  'category',
  'branch',
  'city',
  'budget',
  'homeUniversity',
  'colleges',
]

function sameValue(expected: unknown, actual: unknown): boolean {
  if (Array.isArray(expected) || Array.isArray(actual)) {
    const left = [...((expected as string[] | undefined) ?? [])].map((v) => v.toLowerCase()).sort()
    const right = [...((actual as string[] | undefined) ?? [])].map((v) => v.toLowerCase()).sort()
    return JSON.stringify(left) === JSON.stringify(right)
  }
  return expected === actual
}

async function main() {
  const lines = (await readFile(resolve('eval/ask/queries.jsonl'), 'utf8'))
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const cases = lines.map((line) => JSON.parse(line) as Case)

  let expectedSlots = 0
  let correctSlots = 0
  let exact = 0
  let extraSlots = 0
  const failures: Array<{ query: string; expected: unknown; actual: unknown; field: string }> = []
  const byTag = new Map<string, { cases: number; expected: number; correct: number }>()

  for (const testCase of cases) {
    const actual = parseAdmissionQuery(testCase.query)
    let caseCorrect = true

    for (const key of SLOT_KEYS) {
      if (!(key in testCase.expected)) continue
      expectedSlots++
      const pass = sameValue(testCase.expected[key], actual[key])
      if (pass) correctSlots++
      else {
        caseCorrect = false
        if (failures.length < 20) {
          failures.push({
            query: testCase.query,
            expected: testCase.expected[key],
            actual: actual[key] ?? null,
            field: key,
          })
        }
      }
      for (const tag of testCase.tags) {
        const bucket = byTag.get(tag) ?? { cases: 0, expected: 0, correct: 0 }
        bucket.expected++
        if (pass) bucket.correct++
        byTag.set(tag, bucket)
      }
    }

    for (const key of SLOT_KEYS) {
      if (key in testCase.expected) continue
      if (actual[key] !== undefined) extraSlots++
    }

    for (const tag of testCase.tags) {
      const bucket = byTag.get(tag) ?? { cases: 0, expected: 0, correct: 0 }
      bucket.cases++
      byTag.set(tag, bucket)
    }

    if (caseCorrect) exact++
  }

  // Citation validity is evaluated on real rows through the same helper the
  // API uses. The rules parser itself never produces numbers or citations.
  const fixture = JSON.parse(await readFile(resolve('scripts/ingest/fixtures/dte-2025.json'), 'utf8')) as {
    records: Array<Record<string, unknown>>
  }
  const citations = fixture.records.slice(0, 40).map((record) =>
    citationFor({
      sourceName: String(record.sourceName),
      sourceUrl: String(record.sourceUrl),
      sourceDate: new Date(String(record.sourceDate)),
      verifiedAt: new Date(),
      confidence: 1,
    })
  )
  const validCitations = citations.filter(
    (citation) =>
      citation.source.length > 0 &&
      Boolean(citation.url?.startsWith('https://')) &&
      Boolean(citation.date && /^\d{4}-\d{2}-\d{2}$/.test(citation.date))
  ).length

  const unknownExpected = cases.filter((testCase) => testCase.expected.intent === 'unknown').length
  const unknownActual = cases.filter((testCase) => parseAdmissionQuery(testCase.query).intent === 'unknown').length
  const hallucinatedCutoffs = cases.filter((testCase) =>
    Object.prototype.hasOwnProperty.call(parseAdmissionQuery(testCase.query), 'cutoff')
  ).length

  const slotAccuracy = correctSlots / expectedSlots
  const citationValidity = validCitations / citations.length
  const refusalRate = unknownExpected ? unknownActual / unknownExpected : 0

  const report = {
    generatedAt: new Date().toISOString(),
    queries: cases.length,
    slotAccuracy: round(slotAccuracy, 4),
    exactMatch: round(exact / cases.length, 4),
    expectedSlots,
    correctSlots,
    extraSlots,
    citationValidity: round(citationValidity, 4),
    refusalRate: round(refusalRate, 4),
    hallucinatedCutoffs,
    targets: { slotAccuracy: 0.9, citationValidity: 0.95, hallucinatedCutoffs: 0 },
    byTag: Object.fromEntries(
      [...byTag].map(([tag, bucket]) => [
        tag,
        { ...bucket, accuracy: bucket.expected ? round(bucket.correct / bucket.expected, 4) : null },
      ])
    ),
    failures,
  }

  await mkdir(resolve('docs'), { recursive: true })
  await writeFile(resolve('docs/ask-eval.json'), `${JSON.stringify(report, null, 2)}\n`)

  const failureRows = failures
    .map(
      (failure) =>
        `| ${escapeCell(failure.query)} | ${failure.field} | ${escapeCell(JSON.stringify(failure.expected))} | ${escapeCell(JSON.stringify(failure.actual))} |`
    )
    .join('\n')

  const tagRows = Object.entries(report.byTag)
    .map(([tag, bucket]) => `| ${tag} | ${bucket.cases} | ${bucket.expected} | ${bucket.accuracy ?? 'n/a'} |`)
    .join('\n')

  await writeFile(
    resolve('docs/ASK_EVAL.md'),
    `# Ask slot evaluation

Generated ${report.generatedAt.slice(0, 10)} · rules fallback (no API key)

> The committed eval scores the deterministic rules parser. Provider-backed
> extraction uses the same slot schema and is expected to meet or beat these
> numbers; run the same eval with \`GEMINI_API_KEY\` set to measure it.

## Scorecard

| Metric | Value | Target |
|---|---:|---:|
| Slot accuracy | ${report.slotAccuracy} | ≥ 0.90 |
| Exact query match | ${report.exactMatch} | — |
| Expected slots | ${report.expectedSlots} | — |
| Correct slots | ${report.correctSlots} | — |
| Extra (unexpected) slots | ${report.extraSlots} | — |
| Citation validity | ${report.citationValidity} | ≥ 0.95 |
| Unknown-intent refusal rate | ${report.refusalRate} | — |
| Hallucinated cutoffs | ${report.hallucinatedCutoffs} | 0 |

Citation validity is measured with \`citationFor\` on 40 fixture rows. The rules
parser never emits a percentage, cutoff, or citation, so it cannot hallucinate a
cutoff; the 0 above is structural, not a model claim.

## By tag

| Tag | Cases | Scored slots | Accuracy |
|---|---:|---:|---:|
${tagRows}

## Failures

${failureRows || 'None.'}

## Reproduce

\`\`\`bash
pnpm eval:ask
\`\`\`
`
  )

  console.log(JSON.stringify({ ...report, failures: failures.length }, null, 2))

  if (slotAccuracy < 0.9 || citationValidity < 0.95 || hallucinatedCutoffs > 0) {
    process.exitCode = 1
  }
}

function round(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function escapeCell(value: string) {
  return value.replace(/\|/g, '\\|')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
