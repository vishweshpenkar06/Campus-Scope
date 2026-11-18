'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CircleHelp, RotateCcw, Shield, Target, TrendingUp } from 'lucide-react'
import type { PredictorResult } from '@/lib/types'
import { SourceBadge } from '@/components/data/SourceBadge'
import { BRANCHES } from '@/lib/branches'

export function Predictor({ defaultExam }: { defaultExam?: 'JEE' | 'CET' }) {
  const [percentile, setPercentile] = useState('')
  const [category, setCategory] = useState('OPEN')
  const [branch, setBranch] = useState('Computer Engineering')
  const [exam, setExam] = useState<'JEE' | 'CET'>(defaultExam || 'CET')
  const [budget, setBudget] = useState('')
  const [location, setLocation] = useState('')
  const [result, setResult] = useState<PredictorResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          percentile: Number(percentile),
          category,
          branch,
          exam,
          budget: budget ? Number(budget) : undefined,
          location,
        }),
      })
      const body = await response.json()
      if (!response.ok) setError(body.error)
      else setResult(body.data)
    } catch {
      setError('The predictor is unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Entrance Exam
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value as 'JEE' | 'CET')}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="JEE">JEE Main</option>
              <option value="CET">MHT-CET</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="OPEN">OPEN</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="TFWS">TFWS</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">
          Your Percentile
          <input
            required
            value={percentile}
            onChange={(e) => setPercentile(e.target.value)}
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="e.g. 92.5"
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Preferred Branch
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            {BRANCHES.map((branchName) => (
              <option key={branchName}>{branchName}</option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Annual Budget (₹ lakhs)
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              type="number"
              min="0"
              placeholder="Optional"
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Preferred City
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        <button
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 sm:w-fit"
        >
          {loading ? 'Calculating…' : 'Find my colleges'}
          <ArrowRight className="size-4" />
        </button>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Your Readout</span>
          <CircleHelp className="size-4 opacity-70" />
        </div>

        {result ? (
          <div>
            <div className="mt-6 flex items-baseline gap-2">
              <p className="font-serif text-5xl font-semibold">{result.score}</p>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{result.band}</p>

            <div className="mt-5 flex gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                <Shield className="size-3.5" />
                {result.summary.safe} Safe
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                <Target className="size-3.5" />
                {result.summary.target} Target
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
                <TrendingUp className="size-3.5" />
                {result.summary.reach} Reach
              </div>
            </div>

            {result.matchingColleges.length > 0 && (
              <div className="mt-5 max-h-48 overflow-y-auto">
                {result.matchingColleges.slice(0, 8).map((c) => (
                  <Link
                    key={`${c.id}-${c.branch}-${c.capRound}-${c.percentile}`}
                    href={`/college/${c.id}`}
                    className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0 transition hover:bg-muted/50 -mx-2 px-2 rounded"
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.branch}</div>
                      <div className="mt-1">
                        <SourceBadge
                          sourceName={c.sourceName}
                          sourceUrl={c.sourceUrl}
                          sourceDate={c.sourceDate}
                          verifiedAt={c.verifiedAt}
                        />
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.classification === 'Safe'
                          ? 'bg-green-100 text-green-700'
                          : c.classification === 'Target'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {c.classification}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <ul className="mt-4 grid gap-1 text-xs leading-5 text-muted-foreground">
              {result.assumptions.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex min-h-36 flex-col justify-center">
            <p className="text-lg font-semibold">No prediction yet.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter your percentile and preferences to see Safe / Target / Reach colleges.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setPercentile('')
            setBudget('')
            setLocation('')
            setResult(null)
            setError('')
          }}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
        >
          <RotateCcw className="size-4" /> Reset
        </button>
      </div>
    </div>
  )
}
