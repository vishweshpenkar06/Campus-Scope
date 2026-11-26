import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
        <BarChart3 className="size-4 text-primary" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

// CSS-only horizontal bars, consistent with the seat-matrix visual language — no chart library needed.
function Bars({ rows }: { rows: { label: string; value: number; suffix?: string }[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">No data yet.</p>
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <ul className="grid gap-2.5">
      {rows.map((row) => (
        <li key={row.label} className="grid gap-1">
          <div className="flex justify-between text-xs">
            <span className="truncate font-medium">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">{row.value}{row.suffix ?? ''}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default async function AdminAnalyticsPage() {
  // ponytail: env-csv gate instead of a roles table — fine until more than one admin concern exists
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const session = await auth()
  const email = session?.user?.email?.toLowerCase() ?? ''

  if (!admins.length || !email || !admins.includes(email)) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">Admin area</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in with an address listed in <code className="rounded bg-muted px-1.5 py-0.5 text-sm">ADMIN_EMAILS</code> to view analytics.
        </p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
          ← Back to CampusScope
        </Link>
      </main>
    )
  }

  const [topBranches, topShortlist, users, docs, referrals, alerts] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ['label'], where: { type: 'search' }, _count: { _all: true }, orderBy: { _count: { label: 'desc' } }, take: 8 }),
    prisma.savedCollege.groupBy({ by: ['collegeId'], _count: { _all: true }, orderBy: { _count: { collegeId: 'desc' } }, take: 8 }),
    prisma.user.findMany({ where: { percentile: { not: null } }, select: { percentile: true } }),
    prisma.analyticsEvent.groupBy({ by: ['label'], where: { type: 'docs' }, _avg: { value: true }, _count: { _all: true } }),
    prisma.analyticsEvent.groupBy({ by: ['label'], where: { type: 'referral' }, _count: { _all: true }, orderBy: { _count: { label: 'desc' } }, take: 8 }),
    prisma.alertPreference.count({ where: { active: true } }),
  ])

  const shortlistNames = await prisma.college.findMany({
    where: { id: { in: topShortlist.map((row) => row.collegeId) } },
    select: { id: true, name: true },
  })
  const nameById = new Map(shortlistNames.map((c) => [c.id, c.name]))

  const buckets = [
    ['<60', 0, 60], ['60–70', 60, 70], ['70–80', 70, 80], ['80–90', 80, 90], ['90–100', 90, 100.01],
  ] as const
  const histogram = buckets.map(([label, lo, hi]) => ({
    label,
    value: users.filter((u) => u.percentile !== null && u.percentile >= lo && u.percentile < hi).length,
  }))

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 pb-28">
      <p className="eyebrow">Admin · live telemetry</p>
      <div className="mt-2 flex gap-4 text-sm font-semibold">
        <Link href="/admin/data" className="text-primary hover:underline">Data operations →</Link>
        <Link href="/admin/ingest" className="text-primary hover:underline">Ingestion →</Link>
        <Link href="/admin/leads" className="text-primary hover:underline">Leads →</Link>
        <Link href="/admin/feedback" className="text-primary hover:underline">Feedback →</Link>
      </div>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Analytics Dashboard</h1>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card title="Top searched branches">
          <Bars rows={topBranches.map((r) => ({ label: r.label, value: r._count._all }))} />
        </Card>

        <Card title="Most shortlisted colleges">
          <Bars
            rows={topShortlist.map((r) => ({ label: nameById.get(r.collegeId) ?? `College #${r.collegeId}`, value: r._count._all }))}
          />
        </Card>

        <Card title={`Candidate percentile distribution (${users.length})`}>
          <Bars rows={histogram} />
        </Card>

        <Card title="Document readiness by category (avg % complete)">
          <Bars rows={docs.map((r) => ({ label: r.label, value: Math.round(r._avg.value ?? 0), suffix: '%' }))} />
        </Card>

        <Card title="Top referral sources">
          <Bars rows={referrals.map((r) => ({ label: r.label, value: r._count._all }))} />
        </Card>

        <Card title="Alert opt-ins">
          <Bars rows={[{ label: 'Active', value: alerts }]} />
        </Card>
      </div>

      <p className="mt-6 text-xs leading-5 text-muted-foreground">
        Search telemetry logs branch-filtered directory queries; readiness events arrive from the
        documents checklist as candidates use it. Aggregate only — no document names or personal data are stored.
      </p>
    </main>
  )
}
