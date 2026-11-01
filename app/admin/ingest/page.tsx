import Link from 'next/link'
import { adminEmail } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { StagingTable, type StagingRow } from '@/components/admin/staging-table'

export const dynamic = 'force-dynamic'

const STATUSES = ['pending', 'approved', 'rejected'] as const

export default async function AdminIngestPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const email = await adminEmail()
  if (!email) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">Ingestion review</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in with an address listed in <code className="rounded bg-muted px-1.5 py-0.5 text-sm">ADMIN_EMAILS</code>.
        </p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
          ← Back to CampusScope
        </Link>
      </main>
    )
  }

  const requested = (await searchParams).status
  const status = STATUSES.includes(requested as (typeof STATUSES)[number]) ? requested : undefined

  const colleges = await prisma.college.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const records = await prisma.stagingRecord.findMany({
    where: status ? { status } : {},
    include: { source: { select: { name: true, url: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const rows: StagingRow[] = await Promise.all(
    records.map(async (record) => {
      const payload = record.rawJson as Record<string, unknown>
      const collegeId = Number(payload.collegeId)
      const kind = String(payload.kind ?? 'cutoff')
      let existingPercentile: number | null = null
      if (kind === 'cutoff' && Number.isInteger(collegeId) && collegeId > 0) {
        const existing = await prisma.cutoff.findFirst({
          where: {
            collegeId,
            exam: String(payload.exam ?? ''),
            year: Number(payload.year ?? 0),
            category: String(payload.category ?? ''),
            branch: String(payload.branch ?? ''),
            capRound: Number(payload.capRound ?? 0),
          },
          select: { percentile: true },
        })
        existingPercentile = existing?.percentile ?? null
      }
      return {
        id: record.id,
        status: record.status,
        reason: record.reason,
        createdAt: record.createdAt.toISOString(),
        sourceName: record.source.name,
        sourceUrl: record.source.url,
        collegeName: String(payload.collegeName ?? 'Unknown college'),
        collegeId: Number.isInteger(collegeId) && collegeId > 0 ? collegeId : null,
        branch: String(payload.branch ?? ''),
        category: String(payload.category ?? ''),
        capRound: Number(payload.capRound ?? 0),
        exam: String(payload.exam ?? ''),
        year: Number(payload.year ?? 0),
        percentile: Number(payload.percentile ?? 0),
        matchScore: typeof payload.matchScore === 'number' ? payload.matchScore : null,
        kind,
        existingPercentile,
        fixture: Boolean(payload.fixture),
      }
    })
  )

  const counts = await prisma.stagingRecord.groupBy({ by: ['status'], _count: { _all: true } })
  const countBy = new Map(counts.map((row) => [row.status, row._count._all]))

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 pb-28">
      <p className="eyebrow">Admin · data trust</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Ingestion review</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Nothing reaches the predictor until a person approves it. Approve only after checking the
        source document and the diff below.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterLink label={`All (${counts.reduce((sum, row) => sum + row._count._all, 0)})`} href="/admin/ingest" active={!status} />
        {STATUSES.map((item) => (
          <FilterLink
            key={item}
            label={`${item} (${countBy.get(item) ?? 0})`}
            href={`/admin/ingest?status=${item}`}
            active={status === item}
          />
        ))}
      </div>

      <StagingTable rows={rows} colleges={colleges} />
    </main>
  )
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
      }`}
    >
      {label}
    </Link>
  )
}
