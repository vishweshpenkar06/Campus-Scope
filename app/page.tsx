import Link from 'next/link'
import { ArrowRight, Database, GitCompareArrows, Search } from 'lucide-react'
import { AppShell } from '@/components/app-shell'

export default function Page() {
  return (
    <AppShell>
      <main>
        <section className="border-b border-foreground/10 px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="eyebrow">A research desk for your next decision</p>
              <h1 className="mt-5 max-w-4xl font-serif text-6xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-8xl">
                Choose a college with your eyes open.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
                CampusScope brings the details that matter—fees, courses, placements, and student
                perspective—into one calm place to do your research.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Start with the directory <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/predictor"
                  className="inline-flex items-center gap-2 border border-foreground/15 px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
                >
                  See your starting point <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <aside className="border-l-2 border-primary pl-6">
              <p className="font-serif text-2xl leading-tight">
                Not a ranking. A clearer way to make a shortlist.
              </p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Use the directory to gather options, read the context behind the numbers, then compare
                only the colleges that still feel right.
              </p>
              <div className="mt-7 flex items-center gap-3 border-t border-foreground/10 pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Database className="size-4 text-primary" /> Live catalog · Neon backed
              </div>
            </aside>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-3">
              <Link
                href="/explore"
                className="group rounded-2xl border border-foreground/10 p-8 transition hover:border-primary"
              >
                <div className="grid size-12 place-items-center bg-primary/10 text-primary">
                  <Search className="size-6" />
                </div>
                <h2 className="mt-5 font-serif text-2xl font-semibold">Explore Colleges</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Search by name, location, fee range, and rating. Paginated results from the live
                  catalog.
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open directory <ArrowRight className="size-4" />
                </span>
              </Link>

              <Link
                href="/predictor"
                className="group rounded-2xl border border-foreground/10 p-8 transition hover:border-primary"
              >
                <div className="grid size-12 place-items-center bg-primary/10 text-primary">
                  <Database className="size-6" />
                </div>
                <h2 className="mt-5 font-serif text-2xl font-semibold">Shortlist Predictor</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Enter your rank and budget to get a directional score band. Transparent
                  assumptions, no admission guarantees.
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open predictor <ArrowRight className="size-4" />
                </span>
              </Link>

              <Link
                href="/compare"
                className="group rounded-2xl border border-foreground/10 p-8 transition hover:border-primary"
              >
                <div className="grid size-12 place-items-center bg-primary/10 text-primary">
                  <GitCompareArrows className="size-6" />
                </div>
                <h2 className="mt-5 font-serif text-2xl font-semibold">Compare Colleges</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Select 2–3 colleges and view fees, placements, ratings, and courses side by side.
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open compare <ArrowRight className="size-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        <footer className="px-5 py-10 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="font-serif text-lg font-semibold text-foreground">CampusScope</span>
            <span>Built for thoughtful college research · Track A</span>
          </div>
        </footer>
      </main>
    </AppShell>
  )
}
