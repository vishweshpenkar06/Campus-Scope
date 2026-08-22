'use client'

import { Armchair } from 'lucide-react'
import type { SeatMatrixRecord } from '@/lib/types'

const quotas: [string, keyof SeatMatrixRecord, string][] = [
  ['OPEN', 'openSeats', 'bg-primary'],
  ['OBC', 'obcSeats', 'bg-blue-400'],
  ['SC', 'scSeats', 'bg-amber-400'],
  ['ST', 'stSeats', 'bg-red-400'],
  ['TFWS', 'tfwsSeats', 'bg-purple-400'],
  ['All India', 'allIndiaSeats', 'bg-teal-500'],
]

export function SeatMatrix({ matrices }: { matrices: SeatMatrixRecord[] }) {
  if (!matrices.length) return null

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Sanctioned intake per branch, split by admission quota. Hover a segment for its share.
      </p>

      <div className="mt-5 grid gap-3">
        {matrices.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-semibold">{m.branch}</h4>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Armchair className="size-3.5" />
                {m.totalSeats} total seats
              </span>
            </div>

            <div className="mt-3 flex h-4 overflow-hidden rounded-full" role="img" aria-label={`Seat distribution for ${m.branch}`}>
              {quotas.map(([label, key, color]) => {
                const seats = m[key] as number
                if (!seats) return null
                return (
                  <div
                    key={label}
                    className={`${color} h-full transition hover:brightness-90`}
                    style={{ width: `${(seats / m.totalSeats) * 100}%` }}
                    title={`${label}: ${seats} seats (${Math.round((seats / m.totalSeats) * 100)}%)`}
                  />
                )
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {quotas.map(([label, key, color]) => (
                <span key={label} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`size-2 rounded-full ${color}`} />
                  {label} · <strong className="text-foreground">{m[key] as number}</strong>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
