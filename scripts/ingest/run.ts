import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { detectFormat, extractRecords } from './extract'
import { fetchSource } from './fetch'
import { SOURCES, resolveSource } from './sources'
import type { IngestFormat, RawIngestRecord } from './types'
import { buildIngestReport } from './report'

type Args = {
  source: string
  file?: string
  url?: string
  dryRun: boolean
  limit?: number
}

function parseArgs(argv: string[]): Args {
  const args: Args = { source: 'fixture-2025', dryRun: false }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--source') args.source = argv[++index]
    else if (arg === '--file') args.file = argv[++index]
    else if (arg === '--url') args.url = argv[++index]
    else if (arg === '--limit') args.limit = Number(argv[++index])
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: pnpm ingest --source <id> [--file path | --url url] [--dry-run] [--limit n]

Sources:
${Object.values(SOURCES)
  .map((source) => `  ${source.id.padEnd(14)} ${source.fixture ? 'local fixture' : source.name}`)
  .join('\n')}

Dry-run normalizes and matches against the committed fixture catalog when the
database is unavailable. Without --dry-run, records are staged for human review.`)
      process.exit(0)
    }
  }
  return args
}

async function loadSource(args: Args): Promise<{ records: RawIngestRecord[]; format: IngestFormat; url: string }> {
  const source = resolveSource(args.source, args.url)
  const format = args.file
    ? detectFormat('', args.file)
    : detectFormat('', source.url)

  if (args.file) {
    const path = resolve(args.file)
    const bytes = new Uint8Array(await readFile(path))
    const records = await extractRecords({ bytes, format })
    return { records, format, url: source.url }
  }

  if (source.fixture) {
    const path = resolve(`scripts/ingest/fixtures/${source.fixtureFile ?? `${args.source}.json`}`)
    const bytes = new Uint8Array(await readFile(path))
    return { records: await extractRecords({ bytes, format: 'json' }), format: 'json', url: source.url }
  }

  const fetched = await fetchSource(source.url)
  const detected = detectFormat(fetched.contentType, source.url)
  return {
    records: await extractRecords({ bytes: fetched.bytes, format: detected }),
    format: detected,
    url: source.url,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const source = resolveSource(args.source, args.url)
  const { records, format, url } = await loadSource(args)
  const limited = args.limit ? records.slice(0, args.limit) : records

  if (args.dryRun) {
    const catalog = (
      JSON.parse(await readFile(resolve('scripts/ingest/fixtures/colleges.json'), 'utf8')) as Array<{
        name: string
        location: string
      }>
    ).map((college, index) => ({ id: index + 1, ...college }))
    console.log(
      JSON.stringify(
        { source: args.source, format, ...buildIngestReport(limited, catalog, url) },
        null,
        2
      )
    )
    return
  }

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const { stageRecords } = await import('../../lib/data/staging')
    const result = await stageRecords(prisma, {
      sourceName: source.name,
      sourceUrl: source.url,
      license: source.license,
      records: limited,
    })
    console.log(
      JSON.stringify(
        {
          source: args.source,
          format,
          staged: result.staged,
          duplicates: result.duplicates,
          unmatched: result.unmatched,
          invalid: result.invalid,
          next: 'Review at /admin/ingest. Nothing is published until approved.',
        },
        null,
        2
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
