'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, X } from 'lucide-react'

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('sending')
    setError('')
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          page: window.location.pathname,
          rating,
          message,
          email: email || undefined,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not send feedback.')
      setState('sent')
    } catch (cause) {
      setState('idle')
      setError(cause instanceof Error ? cause.message : 'Could not send feedback.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-2 text-xs font-semibold shadow-lg transition hover:border-primary hover:text-primary sm:gap-2 sm:px-3"
      >
        <MessageSquare className="size-4" />
        <span className="sr-only sm:not-sr-only">Feedback</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="feedback-title" className="font-serif text-xl font-semibold">What should we fix?</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  One thing that confused you or one number you could not trust.
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close feedback" className="rounded p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            {state === 'sent' ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Thanks — feedback saved. If you left an email, we may follow up.
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 grid gap-3">
                <div className="flex gap-1.5" role="group" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-pressed={rating === value}
                      className={`size-9 rounded-lg border text-sm font-semibold ${
                        rating === value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <label className="grid gap-1 text-xs font-semibold">
                  Message
                  <textarea
                    required
                    minLength={5}
                    maxLength={1000}
                    rows={4}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="What worked, what did not, what is missing?"
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Email (optional)
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    maxLength={120}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <button
                  disabled={state === 'sending'}
                  className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {state === 'sending' ? 'Sending…' : 'Send feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
