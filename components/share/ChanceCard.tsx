'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { clearChance } from '@/lib/probability'
import { getOnboardingState } from '@/components/onboarding-modal'
import type { CutoffRecord } from '@/lib/types'

export function ChanceCard({
  collegeId,
  collegeName,
  cutoffs,
}: {
  collegeId: number
  collegeName: string
  cutoffs: CutoffRecord[]
}) {
  const [percentile, setPercentile] = useState('')
  const [category, setCategory] = useState('OPEN')
  const [branch, setBranch] = useState('')

  useEffect(() => {
    const state = getOnboardingState()
    if (state?.percentile) setPercentile(String(state.percentile))
    if (state?.category) setCategory(state.category)
    if (state?.branch && state.branch !== 'All Branches') setBranch(state.branch)
  }, [])

  const branches = useMemo(() => [...new Set(cutoffs.map((cutoff) => cutoff.branch))], [cutoffs])
  const categories = useMemo(() => [...new Set(cutoffs.map((cutoff) => cutoff.category))], [cutoffs])

  const cutoff = useMemo(() => {
    const matching = cutoffs
      .filter((row) => row.category === category)
      .filter((row) => !branch || row.branch === branch)
      .sort((a, b) => b.year - a.year || b.capRound - a.capRound)
    return matching[0] ?? null
  }, [branch, category, cutoffs])

  const numericPercentile = Number(percentile)
  const valid = percentile !== '' && Number.isFinite(numericPercentile) && numericPercentile >= 0 && numericPercentile <= 100
  const chance = valid && cutoff ? Math.round(clearChance(numericPercentile, cutoff.percentile) * 100) : null

  const params = new URLSearchParams()
  if (valid) params.set('percentile', String(numericPercentile))
  params.set('category', category)
  if (branch) params.set('branch', branch)
  const imageUrl = `/api/share-card/${collegeId}?${params.toString()}`

  const shareText = chance !== null
    ? `${collegeName}: ${chance}% directional chance at ${numericPercentile} percentile (${category}${branch ? `, ${branch}` : ''}).`
    : `${collegeName} on CampusScope.`
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== 'undefined' ? window.location.origin : '')
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${origin}/college/${collegeId}`)}`

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-5">
      <h3 className="font-serif text-xl font-semibold">Share a chance card</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        A picture with the cutoff, source, and your percentile. Every card says “directional, not a
        guarantee”.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1.5 text-xs font-semibold">
          Percentile
          <input
            value={percentile}
            onChange={(event) => setPercentile(event.target.value)}
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="e.g. 88.5"
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          >
            {(categories.length ? categories : ['OPEN']).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold">
          Branch
          <select
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Latest across branches</option>
            {branches.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <p className="text-sm font-semibold">
            {chance !== null ? `${chance}% chance` : 'Add a percentile'}
            {cutoff && <span className="block text-[11px] font-normal text-muted-foreground">Cutoff {cutoff.percentile}</span>}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={imageUrl}
          download={`campusscope-${collegeId}.png`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Download className="size-4" /> Download card
        </a>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
        >
          <Share2 className="size-4" /> Share on WhatsApp
        </a>
      </div>
    </section>
  )
}
