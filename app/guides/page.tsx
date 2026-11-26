import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { GUIDES } from '@/lib/content/guides'

export const metadata: Metadata = {
  title: 'Admission guides — CampusScope',
  description: 'Plain-language guides to CAP rounds, option forms, cutoffs, quotas, and documents.',
}

export default function GuidesPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-12 pb-28">
        <p className="eyebrow">Learn the rules before you rank colleges</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Admission guides.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          Short, practical explainers written from official Maharashtra CAP structure. Each guide
          links back to the data tools so you can test what you read.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/60"
            >
              <h2 className="font-serif text-xl font-semibold group-hover:text-primary">{guide.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.description}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[.14em] text-primary">Read guide →</p>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  )
}
