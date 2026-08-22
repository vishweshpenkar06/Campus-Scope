'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Target, TrendingUp, MapPin, Star, ArrowRight, Loader2 } from 'lucide-react'
import { formatINR, formatRating } from '@/lib/format'
import type { OnboardingState } from '@/lib/types'

type MatchCollege = {
  id: number
  name: string
  location: string
  fees: number
  rating: number
  percentile: number
  branch: string
  capRound: number
  classification: 'Safe' | 'Target' | 'Reach'
}

export function AutoAllotment({ onboarding }: { onboarding: OnboardingState }) {
  const [matches, setMatches] = useState<MatchCollege[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!onboarding.exam || !onboarding.percentile) {
      setLoading(false)
      return
    }

    fetch('/api/predict', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        percentile: onboarding.percentile,
        category: onboarding.category,
        branch: onboarding.branch === 'All Branches' ? '' : onboarding.branch,
        exam: onboarding.exam,
      }),
    })
      .then(async (r) => {
        const body = await r.json()
        if (!r.ok) throw new Error(body.error)
        setFailed(false)
        setMatches(body.data?.matchingColleges ?? [])
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [onboarding])

  if (!onboarding.exam || !onboarding.percentile) return null

  const safe = matches.filter((c) => c.classification === 'Safe')
  const target = matches.filter((c) => c.classification === 'Target')
  const reach = matches.filter((c) => c.classification === 'Reach')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Finding your best matches…</span>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center">
        <p className="font-semibold">We couldn&apos;t load your matches.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check your connection and try again in a moment.
        </p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="font-semibold">No matching colleges found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try adjusting your percentile, category, or branch preferences.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Tier
        label="Safe Matches"
        description="Percentile ≥ Cutoff + 2.0% — High chance of admission"
        colleges={safe}
        color="green"
        icon={<Shield className="size-5" />}
      />
      <Tier
        label="Target Matches"
        description="Percentile within Cutoff ± 2.0% — Competitive but achievable"
        colleges={target}
        color="amber"
        icon={<Target className="size-5" />}
      />
      <Tier
        label="Reach / Dream"
        description="Percentile below Cutoff − 2.0% — Aspirational, worth listing higher in your option form"
        colleges={reach}
        color="red"
        icon={<TrendingUp className="size-5" />}
      />
    </div>
  )
}

function Tier({
  label,
  description,
  colleges,
  color,
  icon,
}: {
  label: string
  description: string
  colleges: MatchCollege[]
  color: 'green' | 'amber' | 'red'
  icon: React.ReactNode
}) {
  if (colleges.length === 0) return null

  const colors = {
    green: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-700',
      headerBg: 'bg-green-50',
    },
    amber: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
      headerBg: 'bg-amber-50',
    },
    red: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700',
      headerBg: 'bg-red-50',
    },
  }

  const c = colors[color]

  return (
    <div>
      <div className={`flex items-center gap-2 rounded-t-xl ${c.headerBg} px-5 py-3`}>
        <span className={c.text}>{icon}</span>
        <div>
          <span className={`font-semibold ${c.text}`}>{label}</span>
          <span className="ml-2 text-xs text-muted-foreground">({colleges.length})</span>
        </div>
      </div>
      <p className="px-5 py-2 text-xs text-muted-foreground">{description}</p>
      <div className="space-y-2 px-5 pb-5">
        {colleges.slice(0, 6).map((college) => (
          <Link
            key={`${college.id}-${college.branch}-${college.capRound}`}
            href={`/college/${college.id}`}
            className={`flex items-center justify-between rounded-lg border ${c.border} p-4 transition hover:shadow-sm`}
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium hover:text-primary">{college.name}</div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {college.location}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {formatRating(college.rating)}
                </span>
                <span>{college.branch}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{formatINR(college.fees)}/yr</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
        {colleges.length > 6 && (
          <p className="text-center text-xs text-muted-foreground">
            +{colleges.length - 6} more colleges
          </p>
        )}
      </div>
    </div>
  )
}
