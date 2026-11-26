import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { PROBABILITY_MODEL_VERSION, PROBABILITY_SPREAD, OTHER_THAN_HOME_PENALTY } from '@/lib/probability'
import backtestData from '@/docs/backtest.json'

type BacktestReport = {
  brier: number
  logLoss: number
  forecast?: { mae?: number; coverage?: number } | null
}

const backtest = backtestData as unknown as BacktestReport

export const metadata: Metadata = {
  title: 'Probability model card — CampusScope',
  description: 'How CampusScope turns recorded cutoffs into directional chances, and what it cannot do.',
}

export default function ModelPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-5 py-12 pb-28">
        <p className="eyebrow">Model card · {PROBABILITY_MODEL_VERSION}</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          How the chance number works.
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          The number is a directional estimate from recorded cutoffs. It is not an admission
          guarantee, not a forecast, and never an official DTE prediction.
        </p>

        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">The rule</h2>
          <p className="mt-3 font-mono text-sm">
            P(clear) = 1 / (1 + exp((cutoff − effective percentile) / {PROBABILITY_SPREAD}))
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Effective percentile is the candidate percentile minus {OTHER_THAN_HOME_PENALTY} points
            for an other-than-home-quota query. At the cutoff, the model returns exactly 0.5. Later
            rounds are forced to be at least as easy as earlier rounds.
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            ['Brier score', backtest.brier],
            ['Log loss', backtest.logLoss],
            ['Carry-forward MAE', backtest.forecast?.mae ?? 'n/a'],
            ['Carry-forward coverage', backtest.forecast?.coverage ?? 'n/a'],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">{String(value)}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="font-serif text-xl font-semibold text-emerald-900">What it uses</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-emerald-900">
              <li>Verified cutoff rows with source URL, page, year, round, and category.</li>
              <li>Latest recorded closing cutoff per college and branch.</li>
              <li>Home vs other-than-home level and category code.</li>
              <li>Sample size from historical trend rows.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-serif text-xl font-semibold text-amber-900">What it cannot do</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-900">
              <li>It cannot predict next year’s cutoff; carry-forward MAE is about 12 points.</li>
              <li>It cannot account for seat matrix changes, document verification, or spot notices.</li>
              <li>It does not decide eligibility or allotment.</li>
              <li>It never uses unverified rows in public predictions.</li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">Read the evidence</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The backtest is generated from the official imported dataset and committed as
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">docs/BACKTEST.md</code>.
            The calibration table and limitations are versioned with the model.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/predictor" className="text-primary hover:underline">Try the predictor →</Link>
            <Link href="/methodology" className="text-primary hover:underline">See the data pipeline →</Link>
            <Link href="/guides/cutoffs-explained" className="text-primary hover:underline">Understand cutoffs →</Link>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
