'use client'

import { RotateCcw } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        This section failed to load. Your data is safe — try again in a moment.
      </p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground/60">Reference: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        <RotateCcw className="size-4" /> Try again
      </button>
    </main>
  )
}
