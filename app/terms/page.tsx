import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'

export const metadata: Metadata = { title: 'Terms — CampusScope', description: 'Beta terms for using CampusScope.' }

export default function TermsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 py-12 pb-28 lg:px-8">
        <p className="eyebrow">Terms · beta</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Use it as a starting point, not a verdict.</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-muted-foreground">
          <p><strong className="text-foreground">No guarantee.</strong> Predictions and percentages are directional estimates from historical cutoffs. They are not an admission offer, allotment promise, or legal advice. Always verify against the official CET Cell information brochure and portal.</p>
          <p><strong className="text-foreground">Data accuracy.</strong> We import official public PDFs and link every cutoff row to its source. Errors can still occur; use the feedback button to report one. We may correct, hide, or withdraw a row while it is reviewed.</p>
          <p><strong className="text-foreground">Counsellors.</strong> Counsellor listings are independent. CampusScope does not process payments or guarantee advice quality in this beta. Confirm fees, qualifications, and refund terms directly.</p>
          <p><strong className="text-foreground">Acceptable use.</strong> Do not scrape at abusive rates, attempt to bypass rate limits, upload malicious content, or use the service to misrepresent official DTE data.</p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            These beta terms are a plain-language summary, not a legally reviewed contract.
          </p>
        </div>
      </main>
    </AppShell>
  )
}
