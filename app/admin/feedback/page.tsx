import Link from 'next/link'
import { adminEmail } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminFeedbackPage() {
  const email = await adminEmail()
  if (!email) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">Feedback inbox</h1>
        <p className="mt-3 text-muted-foreground">Sign in with an address listed in ADMIN_EMAILS.</p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">← Back to CampusScope</Link>
      </main>
    )
  }

  const items = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return (
    <main className="mx-auto max-w-4xl px-5 py-10 pb-28">
      <p className="eyebrow">Admin · students</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Feedback inbox</h1>
      <p className="mt-3 text-xs text-muted-foreground">Do not publish personal details from these reports.</p>
      <div className="mt-6 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No feedback yet.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.page || 'unknown page'} · {item.createdAt.toISOString().slice(0, 10)} · {item.email ?? 'no email'}</p>
              {item.rating && <p className="mt-1 text-sm font-semibold">{item.rating}/5</p>}
              <p className="mt-2 whitespace-pre-line text-sm leading-6">{item.message}</p>
            </article>
          ))
        )}
      </div>
    </main>
  )
}
