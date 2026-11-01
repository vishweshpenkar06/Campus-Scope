'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type LeadRow = {
  id: string
  name: string
  phone: string
  percentile: number | null
  category: string | null
  message: string
  status: string
  createdAt: string
  counsellorName: string | null
}

const STATUSES = ['new', 'contacted', 'converted', 'lost']

export function LeadsPipeline({ rows }: { rows: LeadRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function update(id: string, status: string) {
    setBusy(id)
    setError('')
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Update failed')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  if (!rows.length) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No leads yet.
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-3">
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {rows.map((lead) => (
        <article key={lead.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{lead.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {lead.phone} · {lead.percentile ?? 'no percentile'} · {lead.category ?? 'no category'} ·{' '}
                {lead.counsellorName ?? 'unrouted'}
              </p>
            </div>
            <select
              value={lead.status}
              disabled={busy === lead.id}
              onChange={(event) => update(lead.id, event.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-semibold capitalize"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{lead.message}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{new Date(lead.createdAt).toLocaleString('en-IN')}</p>
        </article>
      ))}
    </div>
  )
}
