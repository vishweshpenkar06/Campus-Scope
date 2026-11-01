'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FlaskConical, TriangleAlert, X } from 'lucide-react'

export type StagingRow = {
  id: number
  status: string
  reason: string | null
  createdAt: string
  sourceName: string
  sourceUrl: string
  collegeName: string
  collegeId: number | null
  branch: string
  category: string
  capRound: number
  exam: string
  year: number
  percentile: number
  matchScore: number | null
  kind: string
  existingPercentile: number | null
  fixture: boolean
}

export function StagingTable({
  rows,
  colleges,
}: {
  rows: StagingRow[]
  colleges: Array<{ id: number; name: string }>
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState<Record<number, number>>({})

  async function act(id: number, action: 'approve' | 'reject') {
    setBusy(id)
    setError(null)
    try {
      const response = await fetch(`/api/admin/staging/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: action === 'reject' ? 'Rejected in review — source does not support the row' : undefined,
          edits: action === 'approve' && manual[id] ? { collegeId: manual[id], matchScore: 1 } : undefined,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Action failed')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  if (!rows.length) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No staging records for this filter.
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-3">
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {rows.map((row) => {
        const delta = row.existingPercentile === null ? null : Math.round((row.percentile - row.existingPercentile) * 100) / 100
        return (
          <article key={row.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{row.collegeName}</h2>
                  <Status status={row.status} />
                  {row.fixture && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                      <FlaskConical className="size-3" /> fixture — never publish
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.exam} · {row.capRound ? `Round ${row.capRound}` : row.kind} · {row.category} ·{' '}
                  {row.branch || 'No branch'} · {row.year || 'No year'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {row.status === 'pending' && (
                  <>
                    <button
                      onClick={() => act(row.id, 'approve')}
                      disabled={busy === row.id || (row.matchScore === null && !row.collegeId && !manual[row.id])}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                      title={row.matchScore === null && !row.collegeId && !manual[row.id] ? 'Select a college first' : undefined}
                    >
                      <Check className="size-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => act(row.id, 'reject')}
                      disabled={busy === row.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      <X className="size-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {row.matchScore === null && row.status === 'pending' && (
              <label className="mt-3 grid gap-1 text-xs font-semibold">
                Link to an existing college
                <select
                  value={manual[row.id] ?? row.collegeId ?? ''}
                  onChange={(event) =>
                    setManual((current) => ({ ...current, [row.id]: Number(event.target.value) }))
                  }
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal"
                >
                  <option value="">Choose college…</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Incoming</p>
                <p className="mt-1 font-semibold tabular-nums">{row.percentile.toFixed(2)} percentile</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Existing</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {row.existingPercentile === null ? 'No row' : `${row.existingPercentile.toFixed(2)} percentile`}
                  {delta !== null && delta !== 0 && (
                    <span className="ml-2 text-xs font-medium text-muted-foreground">
                      {delta > 0 ? '+' : ''}
                      {delta}
                    </span>
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source</p>
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs font-medium text-primary hover:underline"
                >
                  {row.sourceName}
                </a>
                <p className="text-[11px] text-muted-foreground">
                  match {row.matchScore === null ? 'none' : `${Math.round(row.matchScore * 100)}%`}
                </p>
              </div>
            </div>

            {row.reason && (
              <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-amber-700">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {row.reason}
              </p>
            )}
          </article>
        )
      })}
    </div>
  )
}

function Status({ status }: { status: string }) {
  const tone =
    status === 'approved'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'rejected'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-amber-200 bg-amber-50 text-amber-700'
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>
      {status}
    </span>
  )
}
