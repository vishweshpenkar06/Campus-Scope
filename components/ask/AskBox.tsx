'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import type { AdmissionQuery } from '@/lib/ai/query'
import type { Citation } from '@/lib/data/provenance'
import { UnderstoodChips } from './UnderstoodChips'
import { CitationCard } from './CitationCard'

type ResultRow = {
  collegeId?: number
  college?: string
  location?: string
  branch?: string
  cutoff?: number
  chance?: number
  classification?: string
  verified?: boolean
  year?: number
  capRound?: number
  annualFees?: number
  title?: string
  date?: string
  citation?: Citation
}

type AskResponse = {
  understood: AdmissionQuery
  provider: string
  answer: string
  results: ResultRow[]
  citations: Citation[]
  assumptions: string[]
  disclaimer: string
  degraded?: boolean
}

const EXAMPLES = [
  '85 percentile CS Pune',
  'Compare COEP vs VJTI for computer engineering',
  'Last date for CAP round 3',
  'Fees under 1.5 lakh',
]

export function AskBox({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<AskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!result) return
    if (window.matchMedia('(max-width: 767px)').matches) {
      resultRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
    }
  }, [result])

  async function ask(text: string, slots?: AdmissionQuery) {
    if (text.trim().length < 3) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: text, ...(slots ? { slots } : {}) }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'The assistant is unavailable.')
      setResult(body)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The assistant is unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={compact ? '' : 'rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7'}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          ask(query)
        }}
        className="grid gap-3"
      >
        <label htmlFor="ask-input" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" />
          Ask the admissions desk
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="ask-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={500}
            placeholder="e.g. 88 percentile OBC, CS in Pune"
            className="h-11 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <button
            disabled={loading || query.trim().length < 3}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Ask
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setQuery(example)
              ask(example)
            }}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            {example}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div ref={resultRef} aria-live="polite" className="mt-5 grid scroll-mt-4 gap-4 border-t border-border pt-4">
          <UnderstoodChips
            query={result.understood}
            onChange={(slots) => ask(query, slots)}
          />

          <p className="text-sm leading-6">{result.answer}</p>

          {result.results.length > 0 && (
            <div className="grid gap-2">
              {result.results.map((row, index) => (
                <ResultCard key={`${row.collegeId ?? row.title ?? index}-${row.branch ?? ''}`} row={row} />
              ))}
            </div>
          )}

          {result.citations.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">
                Citations
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {result.citations.map((citation) => (
                  <CitationCard key={`${citation.source}-${citation.url}-${citation.date}`} citation={citation} />
                ))}
              </div>
            </div>
          )}

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-semibold hover:text-foreground">
              Assumptions ({result.assumptions.length})
            </summary>
            <ul className="mt-2 grid gap-1 leading-5">
              {result.assumptions.map((assumption) => (
                <li key={assumption}>— {assumption}</li>
              ))}
            </ul>
          </details>

          <p className="text-[11px] leading-5 text-muted-foreground">
            {result.disclaimer}
            {result.provider === 'rules' ? ' Parsed by the deterministic rules fallback.' : ''}
            {result.degraded ? ' Catalog currently unavailable — no numbers were invented.' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

function ResultCard({ row }: { row: ResultRow }) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {row.college ?? row.title ?? 'Result'}
          {row.verified === false && (
            <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              unverified
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[
            row.branch,
            row.location,
            row.date,
            row.cutoff !== undefined ? `Cutoff ${row.cutoff}` : null,
            row.capRound ? `Round ${row.capRound}` : null,
            row.year,
            row.annualFees !== undefined ? `₹${row.annualFees.toLocaleString('en-IN')}/yr` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {row.classification && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              row.classification === 'Safe'
                ? 'bg-emerald-100 text-emerald-700'
                : row.classification === 'Target'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {row.classification}
          </span>
        )}
        {row.chance !== undefined && (
          <span className="font-serif text-lg font-semibold tabular-nums">{Math.round(row.chance * 100)}%</span>
        )}
      </div>
    </>
  )

  if (row.collegeId) {
    return (
      <Link
        href={`/college/${row.collegeId}`}
        className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition hover:border-primary/50 hover:bg-muted/40"
      >
        {content}
      </Link>
    )
  }
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">{content}</div>
}
