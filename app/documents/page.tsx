'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { CalendarClock, CheckCircle2, Circle, FileWarning } from 'lucide-react'
import type { DeadlineRecord } from '@/lib/types'

const categories = ['OPEN', 'OBC', 'SC', 'ST', 'EWS', 'TFWS', 'J&K Migrant'] as const
type Category = (typeof categories)[number]

type DocItem = { name: string; note?: string }

// ponytail: static policy snapshot of DTE scrutiny requirements; refresh each admission season or
// move into the DB once admins manage it.
function documentsFor(category: Category, fy: string): DocItem[] {
  const common: DocItem[] = [
    { name: 'CET/JEE admit card & scorecard' },
    { name: 'SSC (10th) marksheet & HSC (12th) marksheet' },
    { name: 'Domicile / Nationality proof' },
    { name: 'Photo ID (Aadhaar) & passport photos' },
    { name: 'CAP registration & option form printout' },
  ]
  const categoryDocs: Partial<Record<Category, DocItem[]>> = {
    OPEN: [],
    OBC: [
      { name: 'Caste Certificate' },
      { name: `Non-Creamy Layer Certificate (${fy})`, note: 'Must be issued for the current financial year' },
      { name: 'Caste Validity Certificate', note: 'Required at admission reporting, not scrutiny' },
    ],
    SC: [
      { name: 'Caste Certificate' },
      { name: 'Caste Validity Certificate', note: 'Apply early — issuance can take weeks' },
    ],
    ST: [
      { name: 'Tribe Certificate' },
      { name: 'Tribe Validity Certificate', note: 'Apply early — issuance can take weeks' },
    ],
    EWS: [
      { name: `EWS Certificate (${fy})`, note: 'Must be issued for the current financial year' },
      { name: 'Income certificate (≤ ₹8 lakh)', note: 'Income cap verified against certificate' },
    ],
    TFWS: [
      { name: `Income declaration / affidavit (≤ ₹8 lakh, ${fy})`, note: 'TFWS tuition waiver is income-linked' },
      { name: 'TFWS undertaking on institute format' },
    ],
    'J&K Migrant': [
      { name: 'J&K migrant / displacement certificate' },
      { name: 'Registration with relief organisation' },
    ],
  }
  return [...common, ...(categoryDocs[category] ?? [])]
}

const STORAGE_KEY = 'campusscope-doc-checklist'

export default function DocumentsPage() {
  const [category, setCategory] = useState<Category>('OPEN')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [fy, setFy] = useState('')
  const [nextDeadline, setNextDeadline] = useState<DeadlineRecord | null>(null)

  useEffect(() => {
    // computed post-mount so SSR/client markup matches (financial-year text changes yearly)
    const now = new Date()
    const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    setFy(`FY ${startYear}–${String(startYear + 1).slice(2)}`)

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.category) setCategory(saved.category)
        if (saved.checked) setChecked(saved.checked)
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ category, checked }))
  }, [category, checked])

  useEffect(() => {
    fetch('/api/deadlines')
      .then((r) => r.json())
      .then((body) => setNextDeadline(body.data?.[0] ?? null))
      .catch(() => {})
  }, [])

  const docs = useMemo(() => documentsFor(category, fy || 'current FY'), [category, fy])
  const doneCount = docs.filter((d) => checked[d.name]).length
  const missing = docs.filter((d) => !checked[d.name])

  // ponytail: coarse readiness telemetry (category + % complete, no document names) for the admin dashboard
  useEffect(() => {
    if (!docs.length) return
    const pct = Math.round((doneCount / docs.length) * 100)
    const timer = setTimeout(() => {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'docs', label: category, value: pct }),
      }).catch(() => {})
    }, 1500)
    return () => clearTimeout(timer)
  }, [doneCount, docs.length, category])

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-5 py-10 pb-28">
        <p className="eyebrow">E-scrutiny preparation</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Document Readiness Calculator</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tick off what you already hold and see exactly what&apos;s missing before scrutiny or
          physical reporting. Your progress is saved on this device.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Candidate category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          {nextDeadline && (
            <p className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              <CalendarClock className="size-4 shrink-0 text-primary" />
              Next milestone: <strong>{nextDeadline.title}</strong> ·{' '}
              {new Date(nextDeadline.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* readiness meter */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Readiness</span>
            <span className="font-serif text-2xl font-semibold">
              {doneCount}/{docs.length}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={docs.length}>
            <div
              className={`h-full rounded-full transition-all ${doneCount === docs.length ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${(doneCount / docs.length) * 100}%` }}
            />
          </div>
          {doneCount === docs.length ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-green-700">
              <CheckCircle2 className="size-4" /> All documents ready — you can report without gaps.
            </p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileWarning className="size-4 text-amber-500" />
              {missing.length} document{missing.length > 1 ? 's' : ''} still outstanding.
            </p>
          )}
        </div>

        <ul className="mt-6 grid gap-2">
          {docs.map((doc) => {
            const done = Boolean(checked[doc.name])
            return (
              <li key={doc.name}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    done ? 'border-green-300 bg-green-50/50' : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={(e) => setChecked((cur) => ({ ...cur, [doc.name]: e.target.checked }))}
                    className="sr-only"
                  />
                  {done ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground/40" aria-hidden />
                  )}
                  <span className="min-w-0">
                    <span className={`block text-sm font-medium ${done ? 'line-through decoration-green-600/40' : ''}`}>
                      {doc.name}
                    </span>
                    {doc.note && <span className="mt-0.5 block text-xs text-amber-700">{doc.note}</span>}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Indicative checklist based on typical DTE/CET Cell scrutiny requirements — verify against
          your official information brochure for the current year.
        </p>
      </main>
    </AppShell>
  )
}
