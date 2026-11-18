'use client'

import { useMemo, useState } from 'react'
import { TrendingDown } from 'lucide-react'
import { SourceBadge } from './data/SourceBadge'
import type { CapRoundTrendRecord } from '@/lib/types'

function Bar({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) {
  if (value === null) return null
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${highlight ? 'bg-emerald-500' : 'bg-primary/70'}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">{value.toFixed(2)}</span>
    </div>
  )
}

export function CapRoundTrends({ trends }: { trends: CapRoundTrendRecord[] }) {
  const exams = [...new Set(trends.map((t) => t.exam))]
  const categories = [...new Set(trends.map((t) => t.category))]
  const [exam, setExam] = useState(exams.includes('CET') ? 'CET' : (exams[0] ?? 'CET'))
  const [category, setCategory] = useState(categories.includes('OPEN') ? 'OPEN' : (categories[0] ?? 'OPEN'))

  const branches = useMemo(
    () => [...new Set(trends.filter((t) => t.exam === exam && t.category === category).map((t) => t.branch))].sort(),
    [trends, exam, category]
  )
  const [branch, setBranch] = useState('')
  const selectedBranch = branch && branches.includes(branch) ? branch : branches.includes('Computer Engineering') ? 'Computer Engineering' : (branches[0] ?? '')

  const rows = trends
    .filter((t) => t.exam === exam && t.category === category && t.branch === selectedBranch)
    .sort((a, b) => b.year - a.year)

  if (!trends.length) return null

  return (
    <div>
      <p className="text-sm leading-6 text-muted-foreground">
        See how a branch actually closes over CAP rounds and years. Later rounds often close lower as
        seats stay vacant — use the source link on each year to check the official PDF.
      </p>

      <div className="mt-4 mb-5 grid gap-2 sm:grid-cols-3">
        <select value={exam} onChange={(e) => { setExam(e.target.value); setBranch('') }} aria-label="Exam" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {exams.map((e) => <option key={e}>{e}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setBranch('') }} aria-label="Category" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={selectedBranch} onChange={(e) => setBranch(e.target.value)} aria-label="Branch" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {branches.map((b) => <option key={b}>{b}</option>)}
        </select>
      </div>

      {rows.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {rows.map((t) => {
            const drop = t.round1Cutoff - (t.spotRoundCutoff ?? t.round3Cutoff)
            const opportunity = drop >= 1.5
            return (
              <div key={t.id} className={`rounded-xl border p-5 ${opportunity ? 'border-emerald-300 bg-emerald-50/40' : 'border-border bg-card'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">{t.year}</p>
                    <h4 className="mt-1 font-semibold leading-snug">{t.branch}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.exam} · {t.category}</p>
                  </div>
                  {opportunity && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                      <TrendingDown className="size-3" /> −{drop.toFixed(1)} by spot
                    </span>
                  )}
                </div>
                <div className="mt-4 grid gap-2">
                  <Bar label="R1" value={t.round1Cutoff} />
                  <Bar label="R2" value={t.round2Cutoff} />
                  <Bar label="R3" value={t.round3Cutoff} />
                  {t.spotRoundCutoff !== null && <Bar label="Spot" value={t.spotRoundCutoff} highlight />}
                </div>
                <div className="mt-4 border-t border-border pt-3">
                  <SourceBadge
                    sourceName={t.sourceName}
                    sourceUrl={t.sourceUrl}
                    sourceDate={t.sourceDate}
                    verifiedAt={t.verifiedAt}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No trend data for that branch/category combination.
        </div>
      )}
    </div>
  )
}
