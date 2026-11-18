'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Reorder, motion } from 'framer-motion'
import { findOrderWarnings, simulateAllotment, type SimulatorChoice } from '@/lib/simulator'
import { AlertTriangle, GripVertical, Loader2, Plus, X, Trophy } from 'lucide-react'

const MAX_CHOICES = 100

export default function SimulatorPage() {
  const [exam, setExam] = useState<'JEE' | 'CET'>('CET')
  const [category, setCategory] = useState('OPEN')
  const [percentile, setPercentile] = useState('')
  const [choices, setChoices] = useState<SimulatorChoice[]>([])
  const [pool, setPool] = useState<SimulatorChoice[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- reset while a new pool loads */
    setPool(null)
    fetch(`/api/simulator?exam=${exam}&category=${encodeURIComponent(category)}`)
      .then(async (r) => {
        const body = await r.json()
        if (!r.ok) throw new Error(body.error)
        return body
      })
      .then((body) => setPool(body.data))
      .catch(() => setError('Could not load cutoff choices.'))
  }, [exam, category])

  const warnings = useMemo(() => findOrderWarnings(choices), [choices])
  const allotment = useMemo(
    () => (percentile ? simulateAllotment(choices, Number(percentile)) : null),
    [choices, percentile]
  )

  function addChoice(choice: SimulatorChoice) {
    if (choices.length >= MAX_CHOICES) return
    if (!choices.some((c) => c.collegeId === choice.collegeId && c.branch === choice.branch))
      setChoices((cur) => [...cur, choice])
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-10 pb-28">
        <p className="eyebrow">CAP / JoSAA simulator</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Mock Option Form Simulator</h1>
          <Link href="/option-form" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Prefer a printable list? Use the Option Form generator →
          </Link>
        </div>

        <section className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Exam
              <select aria-label="Select exam" value={exam} onChange={(e) => setExam(e.target.value as 'JEE' | 'CET')} className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case">
                <option value="JEE">JEE Main</option>
                <option value="CET">MHT-CET</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Category
              <select aria-label="Select category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case">
                {['OPEN', 'OBC', 'SC', 'ST', 'TFWS'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="grid grow gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:grow-0">
              Your percentile
              <input
                aria-label="Your percentile"
                value={percentile}
                onChange={(e) => setPercentile(e.target.value)}
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 92.50"
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case sm:w-44"
              />
            </label>
        </section>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">{error}</p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* preference list */}
          <section aria-label="Your preferences" className="min-w-0 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Your preferences</h2>
              <span className="text-sm text-muted-foreground">{choices.length} / {MAX_CHOICES}</span>
            </div>

            {choices.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Add colleges from the pool to build your mock option form.
              </p>
            ) : (
              <>
                <Reorder.Group axis="y" values={choices} onReorder={setChoices} className="mt-4 grid gap-2">
                  {choices.map((choice, index) => {
                    const warning = warnings.find((w) => w.index === index)
                    const allotted = allotment?.allottedIndex === index
                    return (
                      <Reorder.Item
                        key={`${choice.collegeId}-${choice.branch}`}
                        value={choice}
                        whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
                        className={`list-none rounded-xl border bg-background p-3 ${allotted ? 'border-green-400 ring-2 ring-green-200' : warning ? 'border-amber-300' : 'border-border'}`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/50" aria-hidden />
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold tabular-nums">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{choice.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {choice.branch} · closing cutoff {choice.cutoff.toFixed(2)}
                            </p>
                          </div>
                          {allotted && <Trophy className="size-4 shrink-0 text-green-600" aria-label="Probable allotment" />}
                          <button
                            onClick={() => setChoices((cur) => cur.filter((c) => c !== choice))}
                            aria-label={`Remove ${choice.name}`}
                            className="shrink-0 rounded p-1 text-muted-foreground transition hover:text-destructive"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        {warning && (
                          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                            {warning.message}
                          </p>
                        )}
                      </Reorder.Item>
                    )
                  })}
                </Reorder.Group>

                {warnings.length > 0 && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="size-3.5" />
                    {warnings.length} rule warning{warnings.length > 1 ? 's' : ''} — drag to fix ordering.
                  </p>
                )}
                {percentile && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 rounded-xl border p-4 text-sm ${allotment ? 'border-green-300 bg-green-50' : 'border-destructive/20 bg-destructive/5'}`}
                  >
                    {allotment ? (
                      <>
                        <strong>Probable allotment:</strong> #{allotment.allottedIndex + 1}{' '}
                        {allotment.choice.name} · {allotment.choice.branch}
                        <span className="block text-xs text-green-700">
                          First preference your percentile clears at the latest recorded cutoff.
                        </span>
                      </>
                    ) : (
                      <><strong>No allotment.</strong> Your percentile clears none of these choices — add safer options.</>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </section>

          {/* college pool */}
          <aside aria-label="Available choices" className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-serif text-xl font-semibold">College pool</h2>
            {pool === null ? (
              <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-primary" /></div>
            ) : pool.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No cutoff data for this exam/category yet.</p>
            ) : (
              <ul className="mt-4 grid max-h-[560px] gap-2 overflow-y-auto pr-1">
                {pool.map((choice) => {
                  const added = choices.some((c) => c.collegeId === choice.collegeId && c.branch === choice.branch)
                  return (
                    <li key={`${choice.collegeId}-${choice.branch}`}>
                      <button
                        onClick={() => addChoice(choice)}
                        disabled={added || choices.length >= MAX_CHOICES}
                        className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition enabled:hover:border-primary disabled:opacity-40"
                      >
                        <Plus className="size-3.5 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{choice.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{choice.branch}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                          {choice.cutoff.toFixed(1)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Cutoffs are latest-round closing percentiles for your selected exam/category. Drag rows to reorder — CAP allots the first preference you clear.
            </p>
          </aside>
        </div>
      </main>
    </AppShell>
  )
}
