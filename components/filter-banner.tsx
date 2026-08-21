'use client'

import { Pencil } from 'lucide-react'
import type { OnboardingState } from '@/lib/types'

export function FilterBanner({
  onboarding,
  onEdit,
}: {
  onboarding: OnboardingState
  onEdit: () => void
}) {
  if (!onboarding.exam || !onboarding.percentile) return null

  return (
    <div className="sticky top-0 z-30 border-b border-primary/20 bg-primary/5 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2.5 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-primary">Filter applied:</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {onboarding.exam === 'JEE' ? 'JEE Main' : 'MHT-CET'}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium">{onboarding.percentile}%</span>
          <span className="text-muted-foreground">·</span>
          <span>{onboarding.category}</span>
          {onboarding.branch !== 'All Branches' && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{onboarding.branch}</span>
            </>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary"
        >
          <Pencil className="size-3" />
          Edit
        </button>
      </div>
    </div>
  )
}
