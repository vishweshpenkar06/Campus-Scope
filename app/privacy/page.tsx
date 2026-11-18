import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'

export const metadata: Metadata = { title: 'Privacy — CampusScope', description: 'What CampusScope stores and why.' }

export default function PrivacyPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 py-12 pb-28 lg:px-8">
        <p className="eyebrow">Privacy · beta</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Privacy, in plain language.</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-muted-foreground">
          <p><strong className="text-foreground">What we store.</strong> If you sign in with Google, we store your account identity, email, and saved shortlist. If you submit feedback or a counsellor request, we store the details you enter.</p>
          <p><strong className="text-foreground">What we do not do.</strong> We do not sell personal data, run behavioural advertising, or ask for Aadhaar, passwords, OTPs, or payment credentials. This beta does not process payments.</p>
          <p><strong className="text-foreground">Analytics.</strong> We record aggregate product events such as intent labels and page paths. We do not store free-text ask queries or phone numbers in analytics.</p>
          <p><strong className="text-foreground">Your controls.</strong> You can ask for account deletion or an export of your saved data by contacting the maintainer through the feedback button. This beta is not directed at children under 18 without a parent or guardian.</p>
          <p><strong className="text-foreground">Data sources.</strong> Cutoff data comes from public official Maharashtra CAP PDFs. Personal data is not part of the cutoff dataset.</p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            This is a beta policy, not a substitute for a legally reviewed privacy notice. A full
            DPDP-compliant notice and grievance contact will be published before commercial launch.
          </p>
        </div>
      </main>
    </AppShell>
  )
}
