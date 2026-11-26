'use client'

import { useState } from 'react'
import { BellRing, Check } from 'lucide-react'

const TYPES = [
  { id: 'deadline', label: 'Deadlines' },
  { id: 'cutoff', label: 'Cutoff changes' },
  { id: 'spot', label: 'Spot rounds' },
] as const

export function AlertPreferences() {
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email')
  const [identifier, setIdentifier] = useState('')
  const [types, setTypes] = useState<string[]>(['deadline', 'cutoff'])
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('sending')
    setMessage('')
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier, channel, types, consent, action: 'subscribe' }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not save preferences.')
      setState('done')
      setMessage(channel === 'email' ? 'You will get updates by email.' : 'You will get updates on WhatsApp.')
    } catch (cause) {
      setState('error')
      setMessage(cause instanceof Error ? cause.message : 'Could not save preferences.')
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <BellRing className="size-4 text-primary" />
        <h2 className="font-serif text-xl font-semibold">Get a nudge when it matters</h2>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Opt in to deadline, cutoff, and spot-round updates. No admission spam, no paid alerts.
      </p>

      {state === 'done' ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <Check className="size-4" /> {message}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value as 'email' | 'whatsapp')}
              aria-label="Alert channel"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              type={channel === 'email' ? 'email' : 'tel'}
              required
              placeholder={channel === 'email' ? 'you@example.com' : '+91 98765 43210'}
              aria-label={channel === 'email' ? 'Email address' : 'Phone number'}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {TYPES.map((type) => (
              <label key={type.id} className="flex items-center gap-1.5 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={types.includes(type.id)}
                  onChange={() =>
                    setTypes((current) =>
                      current.includes(type.id)
                        ? current.filter((item) => item !== type.id)
                        : [...current, type.id]
                    )
                  }
                />
                {type.label}
              </label>
            ))}
          </div>
          <label className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            I agree to receive these CampusScope alerts and can unsubscribe at any time.
          </label>
          {message && state === 'error' && <p className="text-xs text-red-700">{message}</p>}
          <button
            disabled={state === 'sending' || !types.length}
            className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {state === 'sending' ? 'Saving…' : 'Enable alerts'}
          </button>
        </form>
      )}
    </section>
  )
}
