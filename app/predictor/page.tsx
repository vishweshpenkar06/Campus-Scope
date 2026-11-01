import { AppShell } from '@/components/app-shell'
import { Predictor } from '@/components/predictor'
import { AskBox } from '@/components/ask/AskBox'

export default function Page() {
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-10 border-b border-foreground/10 pb-6">
          <p className="eyebrow">02 · Shortlist check</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
            A useful first read, not a promise.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Enter your rank and budget to see how your starting point lines up with the catalog.
            The result is directional—use it to begin research, never as an admissions guarantee.
          </p>
        </div>
        <div className="mb-12">
          <AskBox />
        </div>
        <Predictor />
      </main>
    </AppShell>
  )
}
