import type { Metadata } from 'next'
import Link from 'next/link'
import { Database, FileCheck2, ShieldCheck, TriangleAlert } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Data methodology — CampusScope',
  description:
    'How CampusScope imports, verifies, and cites Maharashtra CAP cutoff data from official DTE PDFs.',
}

export default async function MethodologyPage() {
  let stats = { cutoffs: 0, colleges: 0, documents: 0, years: 0 }
  let sources: Array<{
    id: number
    title: string
    url: string
    year: number
    capRound: number
    pageCount: number | null
    rowsImported: number
    publishedAt: Date | null
    fetchedAt: Date
  }> = []

  try {
    const [cutoffs, colleges, documents, years, rows] = await Promise.all([
      prisma.cutoff.count(),
      prisma.college.count({ where: { instituteCode: { not: null } } }),
      prisma.sourceDocument.count(),
      prisma.cutoff.findMany({ distinct: ['year'], select: { year: true } }),
      prisma.sourceDocument.findMany({
        orderBy: [{ year: 'desc' }, { capRound: 'desc' }],
        select: {
          id: true,
          title: true,
          url: true,
          year: true,
          capRound: true,
          pageCount: true,
          rowsImported: true,
          publishedAt: true,
          fetchedAt: true,
        },
      }),
    ])
    stats = { cutoffs, colleges, documents, years: years.length }
    sources = rows
  } catch {
    // Static explanation still renders when the DB is unavailable.
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-12 pb-28 lg:px-8">
        <p className="eyebrow">Trust center</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Every number has a paper trail.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          CampusScope imports Maharashtra CAP cutoff data from official DTE / State CET Cell PDFs.
          Each row keeps its source document, page, round, category code, stage, and verification
          timestamp. Unverified fee, placement, and review data is never presented as official.
          Source: Government of Maharashtra, State CET Cell. CampusScope is independent and not
          affiliated with DTE or the CET Cell.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Official cutoff rows', value: stats.cutoffs.toLocaleString('en-IN'), icon: Database },
            { label: 'DTE institutes', value: stats.colleges.toLocaleString('en-IN'), icon: ShieldCheck },
            { label: 'Source PDFs', value: stats.documents.toLocaleString('en-IN'), icon: FileCheck2 },
            { label: 'Admission years', value: stats.years.toLocaleString('en-IN'), icon: FileCheck2 },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-5">
              <item.icon className="size-5 text-primary" />
              <p className="mt-3 font-serif text-3xl font-semibold">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">Pipeline</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['Download', 'Official CAP cutoff PDF, hashed and cached.'],
              ['Extract', 'pdftotext layout extraction, page by page.'],
              ['Normalize', 'DTE institute codes, branch codes, category codes.'],
              ['Validate', 'Percentile range, row shape, duplicate checks.'],
              ['Publish', 'Source URL + page + verification timestamp on every row.'],
            ].map(([title, body], index) => (
              <li key={title} className="rounded-xl border border-border bg-card p-4">
                <p className="font-serif text-xl font-semibold">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-1 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">Source documents</h2>
          {sources.length ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium text-muted-foreground">Year</th>
                    <th className="p-3 font-medium text-muted-foreground">Round</th>
                    <th className="p-3 font-medium text-muted-foreground">Document</th>
                    <th className="p-3 font-medium text-muted-foreground">Pages</th>
                    <th className="p-3 font-medium text-muted-foreground">Rows</th>
                    <th className="p-3 font-medium text-muted-foreground">Imported</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.id} className="border-t border-border">
                      <td className="p-3">{source.year}</td>
                      <td className="p-3">{source.capRound}</td>
                      <td className="p-3">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                          {source.title}
                        </a>
                      </td>
                      <td className="p-3 tabular-nums">{source.pageCount ?? '—'}</td>
                      <td className="p-3 tabular-nums">{source.rowsImported.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-muted-foreground">
                        {source.publishedAt?.toISOString().slice(0, 10) ?? source.fetchedAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Source registry unavailable. The production database is not reachable from this preview.
            </p>
          )}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <ShieldCheck className="size-5 text-emerald-600" /> What is verified
            </h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
              <li>Cutoff percentile, rank, round, stage, level, category code, and page.</li>
              <li>Institute code and official institute name from the same PDF.</li>
              <li>Source URL, document hash, import timestamp, and parser version.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <TriangleAlert className="size-5 text-amber-600" /> What is not verified yet
            </h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
              <li>Fees, hostel costs, scholarships, placements, and reviews.</li>
              <li>All-India (JEE) seats and non-CAP institute-level admissions.</li>
              <li>Special sub-stages and OCR-only scanned documents.</li>
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">Found an error?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use the feedback button with the institute code, branch code, round, and the value you
            believe is wrong. Corrections are reviewed against the same source PDF before publishing.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/" className="text-primary hover:underline">Open the directory</Link>
            <a href="https://cetcell.mahacet.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Official CET Cell portal
            </a>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
