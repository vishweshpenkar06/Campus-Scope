import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { AlertPreferences } from '@/components/alerts/AlertPreferences'

export const metadata: Metadata = {
  title: 'Deadline and cutoff alerts — CampusScope',
  description: 'Opt in to free Maharashtra CAP deadline, cutoff, and spot-round alerts.',
}

export default function AlertsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 py-12 pb-28">
        <p className="eyebrow">Stay in the loop</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Alerts, only when useful.</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Choose what you want to hear about. We never sell your contact details and you can
          unsubscribe with one request.
        </p>
        <div className="mt-8">
          <AlertPreferences />
        </div>
      </main>
    </AppShell>
  )
}
