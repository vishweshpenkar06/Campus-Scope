import Link from 'next/link'
import { adminEmail } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminDataPage() {
  const email = await adminEmail()
  if (!email) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">Data operations</h1>
        <p className="mt-3 text-muted-foreground">Sign in with an address listed in ADMIN_EMAILS.</p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">← Back to CampusScope</Link>
      </main>
    )
  }

  const [sources, total, byYear, byCategory, pending, photos, colleges] = await Promise.all([
    prisma.sourceDocument.findMany({ orderBy: [{ year: 'desc' }, { capRound: 'desc' }] }),
    prisma.cutoff.count(),
    prisma.cutoff.groupBy({ by: ['year'], _count: { _all: true }, orderBy: { year: 'desc' } }),
    prisma.cutoff.groupBy({ by: ['category'], _count: { _all: true }, orderBy: { _count: { category: 'desc' } }, take: 12 }),
    prisma.correctionRequest.count({ where: { status: 'new' } }),
    prisma.college.groupBy({ by: ['photoIllustrative'], _count: { _all: true } }),
    prisma.college.count(),
  ])

  const duplicate = await prisma.$queryRaw<Array<{ groups: number; extra: number }>>`
    SELECT count(*)::int AS groups, COALESCE(sum(c - 1), 0)::int AS extra
    FROM (
      SELECT "collegeId", "year", "capRound", "branchCode", "categoryCode", "stage", "level", count(*) AS c
      FROM "Cutoff"
      GROUP BY 1, 2, 3, 4, 5, 6, 7
      HAVING count(*) > 1
    ) duplicates
  `

  const latestSource = sources[0]
  const ageDays = latestSource
    // eslint-disable-next-line react-hooks/purity -- server-rendered freshness snapshot
    ? Math.max(0, Math.floor((Date.now() - new Date(latestSource.fetchedAt).getTime()) / 86_400_000))
    : null

  const maxYear = Math.max(1, ...byYear.map((row) => row._count._all))
  const maxCategory = Math.max(1, ...byCategory.map((row) => row._count._all))

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 pb-28">
      <p className="eyebrow">Admin · data trust</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Data operations</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Live coverage, provenance, and review health for the official DTE dataset. Nothing here
        contains personal data.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Cutoff rows', total.toLocaleString('en-IN')],
          ['DTE institutes', colleges.toLocaleString('en-IN')],
          ['Source documents', String(sources.length)],
          ['Last import age', ageDays === null ? 'n/a' : `${ageDays} days`],
          ['Pending corrections', String(pending)],
          ['Duplicate groups', String(duplicate[0]?.groups ?? 0)],
          ['Verified photos', String(photos.find((row) => !row.photoIllustrative)?._count._all ?? 0)],
          ['Illustrative photos', String(photos.find((row) => row.photoIllustrative)?._count._all ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">Rows by year</h2>
          <div className="mt-4 grid gap-2">
            {byYear.map((row) => (
              <div key={row.year} className="flex items-center gap-3">
                <span className="w-12 text-xs font-semibold">{row.year}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${(row._count._all / maxYear) * 100}%` }} />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">{row._count._all.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">Rows by category</h2>
          <div className="mt-4 grid gap-2">
            {byCategory.map((row) => (
              <div key={row.category} className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold">{row.category}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-emerald-600" style={{ width: `${(row._count._all / maxCategory) * 100}%` }} />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">{row._count._all.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold">Source documents</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 font-medium text-muted-foreground">Year</th>
                <th className="p-3 font-medium text-muted-foreground">Round</th>
                <th className="p-3 font-medium text-muted-foreground">Exam</th>
                <th className="p-3 font-medium text-muted-foreground">Rows</th>
                <th className="p-3 font-medium text-muted-foreground">Pages</th>
                <th className="p-3 font-medium text-muted-foreground">Hash</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-t border-border">
                  <td className="p-3">{source.year}</td>
                  <td className="p-3">{source.capRound}</td>
                  <td className="p-3">{source.title.includes('All India') ? 'JEE' : 'CET'}</td>
                  <td className="p-3 tabular-nums">{source.rowsImported.toLocaleString('en-IN')}</td>
                  <td className="p-3 tabular-nums">{source.pageCount ?? '—'}</td>
                  <td className="p-3 font-mono text-[10px] text-muted-foreground">{source.sha256.slice(0, 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/admin/ingest" className="text-primary hover:underline">Staging review →</Link>
        <Link href="/admin/corrections" className="text-primary hover:underline">Correction queue →</Link>
        <Link href="/methodology" className="text-primary hover:underline">Public methodology →</Link>
      </section>
    </main>
  )
}
