import { AppShell } from '@/components/app-shell'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Predictor } from '@/components/predictor'
import { AskBox } from '@/components/ask/AskBox'
import { AlertPreferences } from '@/components/alerts/AlertPreferences'
import { ReferralCard } from '@/components/referral/ReferralCard'
import { PredictorIntro } from '@/components/i18n/PredictorIntro'

export const metadata: Metadata = {
  title: 'College predictor — CampusScope',
  description:
    'Check Safe / Target / Reach engineering colleges against sourced Maharashtra cutoffs, with model assumptions and citations.',
}

export default function Page() {
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <PredictorIntro />
        <div className="mb-12">
          <AskBox />
        </div>
        <Predictor />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <AlertPreferences />
          <ReferralCard />
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-serif text-xl font-semibold">Curious how the chance is computed?</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Versioned, deterministic, and explicit about what it cannot predict.</p>
            <Link href="/model" className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">Read the model card →</Link>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
