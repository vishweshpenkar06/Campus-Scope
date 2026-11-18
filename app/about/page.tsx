import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'

export const metadata: Metadata = {
  title: 'About — CampusScope',
  description: 'Why CampusScope exists, who it is for, and how it stays honest about admissions data.',
}

export default function AboutPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 py-12 pb-28 lg:px-8">
        <p className="eyebrow">About</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Admissions research should be auditable.
        </h1>
        <div className="mt-6 grid gap-4 text-sm leading-7 text-muted-foreground">
          <p>
            CampusScope is an independent research desk for Maharashtra engineering aspirants. It
            turns official DTE / State CET Cell CAP cutoff PDFs into a searchable, cited dataset,
            then layers a directional predictor, an option-form practice tool, and a cited Ask
            interface on top.
          </p>
          <p>
            It is not a ranking, an admissions agent, or an official DTE product. It does not sell
            seats, take commissions on admissions, or claim to know an allotment outcome. It gives
            students a clearer starting point and a paper trail for every number.
          </p>
          <p>
            The project is currently a public beta. Fees, placements, and reviews are being added
            only when a source can be verified. If a number is missing, the interface says so instead
            of filling the gap with a guess.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/methodology" className="text-primary hover:underline">Data methodology</Link>
          <Link href="/predictor" className="text-primary hover:underline">Try the predictor</Link>
          <a href="https://cetcell.mahacet.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Official CET Cell
          </a>
        </div>
      </main>
    </AppShell>
  )
}
