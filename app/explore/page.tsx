import { AppShell } from '@/components/app-shell'
import { CollegeExplorer } from '@/components/college-explorer'

export default function Page() {
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-10 border-b border-foreground/10 pb-6">
          <p className="eyebrow">01 · Directory</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
            Find the right set of options
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Search by place, budget, and signal. Start broad, then let the details narrow the field.
          </p>
        </div>
        <CollegeExplorer />
      </main>
    </AppShell>
  )
}
