import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { OFFICIAL_SOURCES, downloadAndExtract } from './official'
import { parseDteCutoffText } from './dte'
import { parseJeeCutoffText } from './jee'
import { dataQualityReport, ingestOfficialRows, rebuildTrends } from '../../lib/data/official-ingest'

type Args = {
  sources: string[]
  dryRun: boolean
  skipDownload: boolean
  noTrends: boolean
  writeQa: boolean
  limit?: number
  exam?: 'CET' | 'JEE'
}

function parseArgs(argv: string[]): Args {
  const args: Args = { sources: [], dryRun: false, skipDownload: false, noTrends: false, writeQa: true }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--source') args.sources.push(argv[++index])
    else if (arg.startsWith('--source=')) args.sources.push(arg.slice('--source='.length))
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--skip-download') args.skipDownload = true
    else if (arg === '--no-trends') args.noTrends = true
    else if (arg === '--no-write') args.writeQa = false
    else if (arg === '--limit') args.limit = Number(argv[++index])
    else if (arg === '--exam') args.exam = argv[++index] === 'JEE' ? 'JEE' : 'CET'
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: pnpm ingest:dte [--source id] [--dry-run] [--skip-download] [--no-trends] [--limit n]

Sources:
${OFFICIAL_SOURCES.map((source) => `  ${source.id.padEnd(14)} ${source.title}`).join('\n')}`)
      process.exit(0)
    }
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const selected = (args.sources.length
    ? OFFICIAL_SOURCES.filter((source) => args.sources.includes(source.id))
    : OFFICIAL_SOURCES
  ).filter((source) => !args.exam || source.exam === args.exam)
  if (!selected.length) throw new Error(`No matching sources. Known: ${OFFICIAL_SOURCES.map((s) => s.id).join(', ')}`)

  const prisma = new PrismaClient()
  const results: Array<Record<string, unknown>> = []
  try {
    for (const source of selected) {
      const started = Date.now()
      console.log(`\n[${source.id}] preparing ${source.url}`)
      const downloaded = await downloadAndExtract(source, { skipDownload: args.skipDownload })
      console.log(`[${source.id}] ${downloaded.pageCount} pages · sha ${downloaded.sha256.slice(0, 12)}`)

      const parsed = source.exam === 'JEE'
        ? parseJeeCutoffText(downloaded.text, { year: source.year, capRound: source.capRound })
        : parseDteCutoffText(downloaded.text, {
            year: source.year,
            capRound: source.capRound,
            seatType: source.seatType,
          })
      const rows = args.limit ? parsed.rows.slice(0, args.limit) : parsed.rows
      console.log(
        `[${source.id}] parsed ${parsed.rows.length} rows · ${parsed.institutes} institutes · ${parsed.branches} branches · ${parsed.warnings.length} warnings`
      )

      if (parsed.warnings.length) {
        console.warn(`[${source.id}] first warnings:`, parsed.warnings.slice(0, 5))
      }

      let ingest: Record<string, unknown> | null = null
      if (!args.dryRun) {
        ingest = await ingestOfficialRows(prisma, rows, {
          title: source.title,
          url: source.url,
          year: source.year,
          capRound: source.capRound,
          seatType: source.seatType,
          exam: source.exam,
          sha256: downloaded.sha256,
          pageCount: downloaded.pageCount,
          publishedAt: downloaded.publishedAt,
        })
        console.log(`[${source.id}] imported ${ingest.rowsImported} rows in ${Date.now() - started}ms`)
      }

      results.push({
        source: source.id,
        pages: downloaded.pageCount,
        parsed: parsed.rows.length,
        warnings: parsed.warnings.length,
        ingest,
      })
    }

    if (args.dryRun) {
      console.log('\nDry run summary:', JSON.stringify(results, null, 2))
      console.log('Dry run: nothing written to the database.')
      return
    }

    if (!args.noTrends) {
      console.log('\nRebuilding CapRoundTrend from official cutoffs…')
      const trends = await rebuildTrends(prisma)
      console.log(`Rebuilt ${trends} trend rows`)
    }

    const report = await dataQualityReport(prisma)
    console.log('\nData quality:', JSON.stringify(report, null, 2))

    if (args.writeQa) {
      await mkdir(resolve('docs'), { recursive: true })
      await writeFile(resolve('docs/official-data.json'), `${JSON.stringify({ results, report }, null, 2)}\n`)
      await writeFile(
        resolve('docs/OFFICIAL-DATA.md'),
        `# Official data import\n\nGenerated ${report.generatedAt.slice(0, 10)}\n\n` +
          `- Cutoff rows: **${report.cutoffs.toLocaleString('en-IN')}**\n` +
          `- Colleges with DTE institute code: **${report.colleges}**\n` +
          `- Source documents: **${report.documents}**\n` +
          `- Derived trend rows: **${report.trends}**\n` +
          `- Rows missing source/out of range: **${report.rowsMissingSourceOrOutOfRange}**\n` +
          `- Duplicate groups: **${report.duplicateGroups}** (${report.duplicateExtraRows} extra rows)\n\n` +
          `## Rows by year / round\n\n| Year | Round | Rows |\n|---|---:|---:|\n` +
          report.byYear.map((row) => `| ${row.year} | ${row.capRound} | ${row.rows.toLocaleString('en-IN')} |`).join('\n') +
          `\n\n## Rows by category\n\n| Category | Rows |\n|---|---:|\n` +
          report.byCategory.map((row) => `| ${row.category} | ${row.rows.toLocaleString('en-IN')} |`).join('\n') +
          `\n\n## Rows by level\n\n| Level | Rows |\n|---|---:|\n` +
          report.byLevel.map((row) => `| ${row.level} | ${row.rows.toLocaleString('en-IN')} |`).join('\n') +
          `\n`
      )
    }

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
