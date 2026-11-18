import Link from 'next/link'
import { adminEmail } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { CorrectionsTable, type CorrectionRow } from '@/components/admin/corrections-table'

export const dynamic = 'force-dynamic'

export default async function AdminCorrectionsPage() {
  const email = await adminEmail()
  if (!email) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">Correction queue</h1>
        <p className="mt-3 text-muted-foreground">Sign in with an address listed in <code className="rounded bg-muted px-1.5 py-0.5 text-sm">ADMIN_EMAILS</code>.</p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">← Back to CampusScope</Link>
      </main>
    )
  }

  const rows = await prisma.correctionRequest.findMany({
    include: {
      college: { select: { name: true } },
      cutoff: { select: { year: true, capRound: true, category: true, branch: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const data: CorrectionRow[] = rows.map((row) => ({
    id: row.id,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    collegeName: row.college?.name ?? null,
    cutoffLabel: row.cutoff
      ? `${row.cutoff.year} · Round ${row.cutoff.capRound} · ${row.cutoff.category} · ${row.cutoff.branch}`
      : null,
  }))

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 pb-28">
      <p className="eyebrow">Admin · data trust</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Correction queue</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Reports from students. Check the cited source PDF before changing or hiding a row.
      </p>
      <CorrectionsTable rows={data} />
    </main>
  )
}
