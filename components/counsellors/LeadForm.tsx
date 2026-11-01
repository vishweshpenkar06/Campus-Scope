'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'

export function LeadForm({ counsellorId, counsellorName }: { counsellorId: string; counsellorName: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [percentile, setPercentile] = useState('')
  const [category, setCategory] = useState('OPEN')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('sending')
    setError('')
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          counsellorId,
          name,
          phone,
          percentile: percentile ? Number(percentile) : undefined,
          category,
          message,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not send the request.')
      setState('sent')
    } catch (cause) {
      setState('idle')
      setError(cause instanceof Error ? cause.message : 'Could not send the request.')
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
        <CheckCircle2 className="mb-2 size-5" />
        Request sent to {counsellorName}. They will contact you on the number you provided. If you do
        not hear back, call the counsellor directly — CampusScope does not process payments.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-serif text-xl font-semibold">Request a callback</h2>
      <p className="text-xs leading-5 text-muted-foreground">
        Share only what you need for the call. CampusScope stores this request and sends it to the
        counsellor; it is not shown publicly.
      </p>
      <label className="grid gap-1.5 text-sm font-semibold">
        Name
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Phone (WhatsApp preferred)
        <input
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          inputMode="tel"
          pattern="[0-9+\-\s]{10,18}"
          placeholder="10-digit mobile number"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          Percentile (optional)
          <input
            value={percentile}
            onChange={(event) => setPercentile(event.target.value)}
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          >
            {['OPEN', 'OBC', 'SC', 'ST', 'EWS', 'TFWS', 'VJ/NT', 'SEBC', 'PWD', 'DEF'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold">
        What do you need help with?
        <textarea
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          minLength={10}
          maxLength={1000}
          rows={4}
          placeholder="e.g. I have 82 percentile OBC and want CS in Pune under ₹1.5 lakh."
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        disabled={state === 'sending'}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {state === 'sending' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send request
      </button>
      <p className="text-[11px] leading-5 text-muted-foreground">
        By sending, you agree that CampusScope may share this request with this counsellor. Do not
        submit Aadhaar, passwords, or payment details.
      </p>
    </form>
  )
}
