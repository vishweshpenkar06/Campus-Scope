'use client'

import { useMemo, useState } from 'react'
import { Calculator, X } from 'lucide-react'
import { formatINR } from '@/lib/format'
import { bestNetTuitionPerYear, schemeMatrix, type ConcessionPolicy, type IncomeBracket } from '@/lib/scholarships'

const brackets: [IncomeBracket, string][] = [
  ['under25L', 'Under ₹2.5 LPA'],
  ['under8L', '₹2.5 – ₹8 LPA'],
  ['above8L', 'Above ₹8 LPA'],
]

export function ScholarshipCalculator({
  fees,
  hostelFees,
  hostelAvailable,
  cautionDeposit = 0,
  policy,
}: {
  fees: number
  hostelFees: number
  hostelAvailable: boolean
  cautionDeposit?: number
  policy: ConcessionPolicy
}) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('OPEN')
  const [income, setIncome] = useState<IncomeBracket>('under25L')

  const rows = useMemo(() => schemeMatrix(category, income, policy), [category, income, policy])
  const hostel = hostelAvailable ? hostelFees : 0
  const netPerYear = bestNetTuitionPerYear(fees, rows)
  const fourYearTotal = netPerYear * 4 + hostel * 4 + cautionDeposit

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
      >
        <Calculator className="size-4" />
        Scholarship Calculator
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            role="dialog"
            aria-label="Scholarship calculator"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-2xl font-semibold">Scholarship Calculator</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick your profile — totals update instantly. Only the single best waiver applies.
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Candidate category
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case">
                  {['OPEN', 'OBC', 'SC', 'ST', 'TFWS'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Family income</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {brackets.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setIncome(value)}
                      aria-pressed={income === value}
                      className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${
                        income === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <ul className="grid gap-1.5 rounded-xl border border-border bg-card p-3 text-sm">
                {rows.map((row) => (
                  <li key={row.name} className="flex items-center justify-between gap-2">
                    <span>
                      <span className={row.eligible ? 'font-medium' : 'text-muted-foreground line-through decoration-muted-foreground/40'}>{row.name}</span>
                      {row.reason && !row.eligible && <span className="ml-1 text-xs text-muted-foreground">({row.reason})</span>}
                    </span>
                    <span className={`shrink-0 font-semibold ${row.eligible ? 'text-green-700' : 'text-muted-foreground/50'}`}>
                      −{row.concessionPct}%{!row.eligible && ' ✕'}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-green-300 bg-green-50 p-4">
                <p className="flex justify-between text-sm"><span>Net tuition / year</span><strong>{formatINR(netPerYear)}</strong></p>
                {hostelAvailable && <p className="mt-1 flex justify-between text-sm"><span>Hostel / year</span><strong>{formatINR(hostel)}</strong></p>}
                {cautionDeposit > 0 && <p className="mt-1 flex justify-between text-sm"><span>Caution deposit</span><strong>{formatINR(cautionDeposit)}</strong></p>}
                <p className="mt-2 flex justify-between border-t border-green-200 pt-2 font-serif text-lg font-semibold">
                  <span>4-year total</span><span>{formatINR(fourYearTotal)}</span>
                </p>
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                Indicative estimates from typical state scheme caps — confirm current rules on official portals.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
