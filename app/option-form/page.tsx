'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { ArrowDown, ArrowUp, FileDown, Loader2, Printer, X } from 'lucide-react'
import type { PredictorResult } from '@/lib/types'

type Preference = PredictorResult['matchingColleges'][number]

type Inputs = {
  exam: 'JEE' | 'CET'
  percentile: string
  category: string
  branches: string[]
  budget: string
}

const branchOptions = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Civil Engineering',
]

const STORAGE_KEY = 'campusscope-option-form'
const bandStyles: Record<string, string> = {
  Safe: 'bg-green-100 text-green-700',
  Target: 'bg-amber-100 text-amber-700',
  Reach: 'bg-red-100 text-red-700',
}

function csvEscape(value: unknown) {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function OptionFormPage() {
  const [inputs, setInputs] = useState<Inputs>({
    exam: 'JEE',
    percentile: '',
    category: 'OPEN',
    branches: [],
    budget: '',
  })
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPreferences(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  function toggleBranch(branch: string) {
    setInputs((cur) => ({
      ...cur,
      branches: cur.branches.includes(branch)
        ? cur.branches.filter((b) => b !== branch)
        : [...cur.branches, branch],
    }))
  }

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          percentile: Number(inputs.percentile),
          category: inputs.category,
          exam: inputs.exam,
          // empty selection means all branches
          branch: inputs.branches.length === 1 ? inputs.branches[0] : '',
          budget: inputs.budget ? Number(inputs.budget) : undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Could not generate matches.')
      const matches: Preference[] = body.data.matchingColleges ?? []
      if (inputs.branches.length > 1) {
        const allowed = new Set(inputs.branches.map((b) => b.toLowerCase()))
        setPreferences(matches.filter((m) => allowed.has(m.branch.toLowerCase())))
      } else {
        // CAP awards your highest cleared preference, so order by desirability: closing cutoff desc
        setPreferences([...matches].sort((a, b) => b.percentile - a.percentile))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function move(index: number, direction: -1 | 1) {
    setPreferences((current) => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function exportCsv() {
    const header = ['Preference #', 'College ID', 'College Name', 'Branch', 'Closing Percentile', 'CAP Round', 'Band']
    const lines = [header.join(',')]
    preferences.forEach((p, i) => {
      lines.push([i + 1, p.id, p.name, p.branch, p.percentile, `Round ${p.capRound}`, p.classification].map(csvEscape).join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'campusscope-option-form.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const summaryLine = useMemo(
    () =>
      `${inputs.exam} · ${inputs.percentile || '—'}%ile · ${inputs.category}`,
    [inputs]
  )

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-10 pb-28">
        <p className="eyebrow">Counselling utility</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Option Form Generator</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Build a CAP preference list from your percentile and target branches. Reorder freely — CAP
          allots the highest preference you clear. Export as CSV or PDF for the official portal.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
          <section className="rounded-2xl border border-border bg-card p-5 print:hidden">
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Entrance Exam
                <select
                  value={inputs.exam}
                  onChange={(e) => setInputs((c) => ({ ...c, exam: e.target.value as 'JEE' | 'CET' }))}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="JEE">JEE Main</option>
                  <option value="CET">MHT-CET</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Your Percentile
                <input
                  value={inputs.percentile}
                  onChange={(e) => setInputs((c) => ({ ...c, percentile: e.target.value }))}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 92.50"
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Category
                <select
                  value={inputs.category}
                  onChange={(e) => setInputs((c) => ({ ...c, category: e.target.value }))}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {['OPEN', 'OBC', 'SC', 'ST', 'TFWS'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2 text-sm font-semibold">
                Target Branches <span className="text-xs font-normal text-muted-foreground">(none selected = all branches)</span>
                <div className="flex flex-wrap gap-2">
                  {branchOptions.map((branch) => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => toggleBranch(branch)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        inputs.branches.includes(branch)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                Annual Budget (₹ lakhs, optional)
                <input
                  value={inputs.budget}
                  onChange={(e) => setInputs((c) => ({ ...c, budget: e.target.value }))}
                  type="number"
                  min="0"
                  placeholder="No limit"
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                />
              </label>

              <button
                onClick={generate}
                disabled={loading || !inputs.percentile}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Generate preference list'}
              </button>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          </section>

          <section className="min-w-0">
            {preferences.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center print:hidden">
                <p className="font-semibold">No preferences yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fill in your details and generate a list, or revisit a saved one.
                </p>
                <Link href="/explore" className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
                  Browse colleges instead →
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
                  <p className="text-sm text-muted-foreground">{summaryLine}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={exportCsv}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
                    >
                      <FileDown className="size-4" /> CSV
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Printer className="size-4" /> PDF
                    </button>
                  </div>
                </div>

                <ol data-print-root className="grid gap-2">
                  <li className="hidden w-full print:block">
                    <h1 className="font-serif text-2xl font-bold">CAP Option Form — CampusScope</h1>
                    <p className="text-sm text-muted-foreground">{summaryLine} · generated {new Date().toLocaleDateString('en-IN')}</p>
                  </li>
                  {preferences.map((p, index) => (
                    <li
                      key={`${p.id}-${p.branch}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold tabular-nums">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.branch} · cutoff {p.percentile.toFixed(2)} · Round {p.capRound}
                        </p>
                      </div>
                      <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline ${bandStyles[p.classification]}`}>
                        {p.classification}
                      </span>
                      <span className="flex shrink-0 flex-col gap-0.5 print:hidden">
                        <button aria-label={`Move ${p.name} up`} onClick={() => move(index, -1)} className="rounded p-0.5 hover:bg-muted disabled:opacity-30" disabled={index === 0}>
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button aria-label={`Move ${p.name} down`} onClick={() => move(index, 1)} className="rounded p-0.5 hover:bg-muted disabled:opacity-30" disabled={index === preferences.length - 1}>
                          <ArrowDown className="size-3.5" />
                        </button>
                      </span>
                      <button
                        aria-label={`Remove ${p.name}`}
                        onClick={() => setPreferences((cur) => cur.filter((x) => !(x.id === p.id && x.branch === p.branch)))}
                        className="shrink-0 rounded p-1 text-muted-foreground transition hover:text-destructive print:hidden"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  )
}
