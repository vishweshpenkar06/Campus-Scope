'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type CorrectionRow = {
  id: number
  message: string
  status: string
  createdAt: string
  collegeName: string | null
  cutoffLabel: string | null
}

const STATUSES = ['new', 'reviewing', 'resolved', 'rejected']

export function CorrectionsTable({ rows }: { rows: CorrectionRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function update(id: number, status: string) {
    setBusy(id)
    setError('')
    try {
      const response = await fetch(`/api/admin/corrections/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Update failed')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  if (!rows.length) {
    return <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No correction reports yet.</div>
  }

  return (
    <div className="mt-6 grid gap-3">
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{row.collegeName ?? 'General report'}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{row.cutoffLabel ?? 'No specific row'} · {new Date(row.createdAt).toLocaleString('en-IN')}</p>
            </div>
            <select
              value={row.status}
              disabled={busy === row.id}
              onChange={(event) => update(row.id, event.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-semibold capitalize"
            >
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{row.message}</p>
        </article>
      ))}
    </div>
  )
}
