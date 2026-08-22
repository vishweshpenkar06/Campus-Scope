'use client'

import { GraduationCap, IndianRupee, Wallet } from 'lucide-react'
import { formatINR, parseList } from '@/lib/format'
import { ScholarshipCalculator } from './scholarship-calculator'

type Props = {
  fees: number
  hostelFees: number
  hostelAvailable: boolean
  cautionDeposit?: number
  eligibleScholarships?: string
  policy: {
    ebcConcessionPct: number
    tfwsConcessionPct: number
    scStConcessionPct: number
    minorityConcessionPct: number
  }
}

export function FinancialCard({ fees, hostelFees, hostelAvailable, cautionDeposit = 0, eligibleScholarships, policy }: Props) {
  const scholarships = eligibleScholarships ? parseList(eligibleScholarships) : []
  const hostel = hostelAvailable ? hostelFees : 0

  // headline rows use the college's own recorded waiver percentages (TFWS/EBC)
  const headlineRows = [
    { name: 'OPEN', label: 'No concession', tuitionFactor: 1 },
    { name: 'EBC', label: `EBC scholarship — ${policy.ebcConcessionPct}% tuition waiver`, tuitionFactor: 1 - policy.ebcConcessionPct / 100 },
    { name: 'TFWS', label: `TFWS — ${policy.tfwsConcessionPct}% tuition waiver`, tuitionFactor: 1 - policy.tfwsConcessionPct / 100 },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" />
          <h3 className="font-serif text-xl font-semibold">Financial Breakdown</h3>
        </div>
        <ScholarshipCalculator
          fees={fees}
          hostelFees={hostelFees}
          hostelAvailable={hostelAvailable}
          cautionDeposit={cautionDeposit}
          policy={policy}
        />
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">Tuition / year</p>
          <p className="font-semibold">{formatINR(fees)}</p>
        </div>
        {hostelAvailable && (
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">Hostel / year</p>
            <p className="font-semibold">{formatINR(hostel)}</p>
          </div>
        )}
        {cautionDeposit > 0 && (
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">Caution deposit (one-time)</p>
            <p className="font-semibold">{formatINR(cautionDeposit)}</p>
          </div>
        )}
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-semibold">Category</th>
              <th className="px-3 py-2 font-semibold">Tuition / yr</th>
              <th className="px-3 py-2 font-semibold">4-yr total{hostel ? ' incl. hostel' : ''}</th>
            </tr>
          </thead>
          <tbody>
            {headlineRows.map((c) => (
              <tr key={c.name} className="border-t border-border">
                <td className="px-3 py-2">
                  <span className="font-semibold">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{c.label}</span>
                </td>
                <td className="px-3 py-2">{formatINR(Math.round(fees * c.tuitionFactor))}</td>
                <td className="px-3 py-2 font-medium">
                  <IndianRupee className="-ml-1 inline size-3" />
                  {formatINR(Math.round((fees * c.tuitionFactor + hostel) * 4 + cautionDeposit))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scholarships.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
            <GraduationCap className="size-3.5" /> Eligible schemes
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {scholarships.map((s) => (
              <span key={s} className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Concession estimates are indicative — confirm current rules on the official scholarship portal.
          </p>
        </div>
      )}
    </div>
  )
}
