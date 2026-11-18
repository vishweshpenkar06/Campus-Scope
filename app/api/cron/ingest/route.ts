import { prisma } from '@/lib/prisma'
import { stageRecords } from '@/lib/data/staging'
import { detectFormat, extractRecords } from '@/scripts/ingest/extract'
import { fetchSource } from '@/scripts/ingest/fetch'
import { resolveSource } from '@/scripts/ingest/sources'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const sourceId = url.searchParams.get('source') ?? process.env.INGEST_SOURCE
  if (!sourceId) {
    return Response.json({ error: 'Pass ?source= or set INGEST_SOURCE' }, { status: 400 })
  }

  try {
    // Only the server-side registry/env may choose the URL. Do not accept an
    // arbitrary URL in the cron request (SSRF).
    const source = resolveSource(sourceId)
    const fetched = await fetchSource(source.url)
    const format = detectFormat(fetched.contentType, source.url)
    const records = await extractRecords({ bytes: fetched.bytes, format })
    if (records.length > 5000) {
      return Response.json({ error: 'Source exceeds 5000 records per run' }, { status: 413 })
    }
    const result = await stageRecords(prisma, {
      sourceName: source.name,
      sourceUrl: source.url,
      license: source.license,
      records,
    })
    return Response.json({
      data: {
        ...result,
        parsed: records.length,
        stagedOnly: true,
        reviewAt: '/admin/ingest',
        ranAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Ingestion failed' },
      { status: 500 }
    )
  }
}
