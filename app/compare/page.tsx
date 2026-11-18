'use client'

import { Suspense, useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { RoiBadge } from '@/components/roi-badge'
import { formatINR, formatPackage, parseList } from '@/lib/format'
import type { CollegeDetail, CompareResponse } from '@/lib/types'
import { useSearchParams } from 'next/navigation'

function CompareContent() {
  const params = useSearchParams()
  const [state, setState] = useState<CompareResponse | null>(null)
  const [error, setError] = useState('')
  const ids = params.get('ids') ?? ''

  useEffect(() => {
    if (!ids) return
    fetch(`/api/compare?ids=${ids}`)
      .then(async (r) => {
        const body = await r.json()
        if (!r.ok) throw new Error(body.error)
        setState(body)
      })
      .catch((e) => setError(e.message))
  }, [ids])

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-10 pb-28">
        <p className="text-sm font-semibold text-primary">Side by side</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Compare colleges</h1>

        {!ids || ids.split(',').length < 2 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-14 text-center">
            <h2 className="font-semibold">Select at least two colleges</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Return to Explore colleges and add options to your compare tray.
            </p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center text-sm">
            {error}
          </div>
        ) : !state ? (
          <div className="mt-10 h-64 animate-pulse rounded-xl bg-muted" />
        ) : (
          <CompareTable data={state.data} />
        )}
      </main>
    </AppShell>
  )
}

function CompareTable({ data }: { data: CompareResponse['data'] }) {
  type College = CollegeDetail
  const rows: [string, (c: College) => React.ReactNode][] = [
    ['Annual fees', (c) => (c.fees > 0 ? `${formatINR(c.fees)} / yr` : 'Not verified')],
    ['4-Yr ROI', (c) =>
      c.placements[0] && c.fees > 0 && c.placements[0].avgPackage > 0 ? (
        <RoiBadge compact avgPackageInr={c.placements[0].avgPackage * 100000} fees={c.fees} hostelFees={c.hostelAvailable ? c.hostelFees : 0} />
      ) : (
        'Not verified'
      )],
    ['Rating', (c) => (c.rating > 0 ? `${c.rating.toFixed(1)} / 5` : 'Not verified')],
    ['NIRF rank', (c) => (c.nirfRank ? `#${c.nirfRank}` : 'Not ranked')],
    ['Autonomous status', (c) => (c.autonomous ? 'Autonomous' : 'Non-autonomous')],
    ['Student : faculty ratio', (c) => c.studentFacultyRatio || 'Not listed'],
    ['Campus size', (c) => c.campusSize || 'Not listed'],
    ['Latest average package', (c) =>
      c.placements[0] && c.placements[0].avgPackage > 0 ? formatPackage(c.placements[0].avgPackage) : 'Not verified'],
    ['Highest package', (c) =>
      c.placements[0] && c.placements[0].highestPackage > 0 ? formatPackage(c.placements[0].highestPackage) : 'Not verified'],
    ['Placement rate', (c) =>
      c.placements[0] && c.placements[0].placementRate > 0 ? `${c.placements[0].placementRate}%` : 'Not verified'],
    ['Top recruiters', (c) => {
      const recruiters = parseList(c.topRecruiters ?? '')
      return recruiters.length ? recruiters.join(', ') : 'Not listed'
    }],
    ['Hostel facilities', (c) =>
      c.hostelAvailable ? (c.hostelFees > 0 ? `Available · ${formatINR(c.hostelFees)}/yr` : 'Available') : 'Not verified'],
    ['Caution deposit', (c) => (c.cautionDeposit ? formatINR(c.cautionDeposit) : 'Not listed')],
    ['Courses offered', (c) =>
      c.courses.length ? c.courses.map((cr) => cr.name).join(', ') : 'Not listed'],
    ['Reviews', (c) =>
      c.reviews.length
        ? `${c.reviews.length} review${c.reviews.length > 1 ? 's' : ''}`
        : 'No reviews'],
  ]

  return (
    <div className="mt-10 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] text-left">
        <thead className="bg-muted">
          <tr>
            <th className="w-44 p-5 text-sm text-muted-foreground">Metric</th>
            {data.map((c) => (
              <th key={c.id} className="p-5">
                <div className="font-bold">{c.name}</div>
                <div className="mt-1 text-sm font-normal text-muted-foreground">{c.location}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, fn]) => (
            <tr key={label} className="border-t border-border">
              <td className="p-5 text-sm font-medium text-muted-foreground">{label}</td>
              {data.map((c) => (
                <td key={c.id} className="p-5 text-sm">
                  {fn(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  )
}
