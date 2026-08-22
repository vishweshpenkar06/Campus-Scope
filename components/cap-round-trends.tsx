'use client'

import { useMemo, useState } from 'react'
import { TrendingDown } from 'lucide-react'
import type { CapRoundTrendRecord } from '@/lib/types'

// percentile axis is zoomed to this window so small round-to-round drops stay visible
const AXIS_MIN = 50
const AXIS_MAX = 100

function Bar({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) {
  if (value === null) return null
  const width = `${((value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100}%`
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${highlight ? 'bg-green-500' : 'bg-primary/70'}`}
          style={{ width }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums">{value.toFixed(2)}</span>
    </div>
  )
}

export function CapRoundTrends({ trends }: { trends: CapRoundTrendRecord[] }) {
  const exams = [...new Set(trends.map((t) => t.exam))]
  const categories = [...new Set(trends.map((t) => t.category))]
  const [exam, setExam] = useState(exams[0] ?? 'JEE')
  const [category, setCategory] = useState(categories[0] ?? 'OPEN')

  const filtered = useMemo(() => trends.filter((t) => t.exam === exam && t.category === category), [trends, exam, category])

  if (!trends.length) return null

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Closing percentiles fall across rounds as seats stay vacant — late rounds and spot rounds are
        realistic entry points.
      </p>

      <div className="mt-4 mb-5 flex flex-wrap gap-3">
        <select value={exam} onChange={(e) => setExam(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {exams.map((e) => <option key={e}>{e}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((t) => {
          const drop = t.round1Cutoff - (t.spotRoundCutoff ?? t.round3Cutoff)
          const opportunity = drop >= 1.5
          return (
            <div key={t.id} className={`rounded-xl border p-5 ${opportunity ? 'border-green-300 bg-green-50/40' : 'border-border bg-card'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold leading-snug">{t.branch}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.exam} · {t.category} · {t.year}</p>
                </div>
                {opportunity && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[11px] font-bold text-green-700">
                    <TrendingDown className="size-3" />
                    −{drop.toFixed(1)} by spot
                  </span>
                )}
              </div>
              <div className="mt-4 grid gap-2">
                <Bar label="R1" value={t.round1Cutoff} />
                <Bar label="R2" value={t.round2Cutoff} />
                <Bar label="R3" value={t.round3Cutoff} />
                {t.spotRoundCutoff !== null && <Bar label="Spot" value={t.spotRoundCutoff} highlight />}
              </div>
            </div>
          )
        })}
      </div>

      {!filtered.length && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No trend data for that exam/category combination.
        </div>
      )}
    </div>
  )
}
