import Link from 'next/link'
import { adminEmail } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { LeadsPipeline, type LeadRow } from '@/components/admin/leads-pipeline'

export const dynamic = 'force-dynamic'

export default async function AdminLeadsPage() {
  const email = await adminEmail()
  if (!email) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">Lead pipeline</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in with an address listed in <code className="rounded bg-muted px-1.5 py-0.5 text-sm">ADMIN_EMAILS</code>.
        </p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
          ← Back to CampusScope
        </Link>
      </main>
    )
  }

  const leads = await prisma.lead.findMany({
    include: { counsellor: { select: { displayName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const rows: LeadRow[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    percentile: lead.percentile,
    category: lead.category,
    message: lead.message,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
    counsellorName: lead.counsellor?.displayName ?? null,
  }))

  const counts = ['new', 'contacted', 'converted', 'lost'].map((status) => ({
    status,
    count: rows.filter((row) => row.status === status).length,
  }))

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 pb-28">
      <p className="eyebrow">Admin · growth</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Lead pipeline</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {counts.map((item) => (
          <span key={item.status} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold capitalize">
            {item.status}: {item.count}
          </span>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Leads contain personal contact data. Keep access limited to ADMIN_EMAILS; do not export or
        share them outside the counselling workflow.
      </p>
      <LeadsPipeline rows={rows} />
    </main>
  )
}
