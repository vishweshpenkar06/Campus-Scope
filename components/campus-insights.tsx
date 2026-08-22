'use client'

import { Coffee, ShieldCheck, UserRound } from 'lucide-react'
import { Star } from 'lucide-react'
import type { CampusInsightRecord } from '@/lib/types'

const strictnessTone = (value: string) =>
  value.startsWith('Very strict')
    ? 'bg-red-100 text-red-700'
    : value.startsWith('Moderate')
      ? 'bg-amber-100 text-amber-700'
      : 'bg-green-100 text-green-700'

export function CampusInsights({ insights }: { insights: CampusInsightRecord[] }) {
  if (!insights.length) return null

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Anonymous, moderated notes from seniors — the details brochures leave out.
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {insights.map((insight) => (
          <article key={insight.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <UserRound className="size-3" />
                {insight.authorRole}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${strictnessTone(insight.attendanceStrictness)}`}>
                Attendance: {insight.attendanceStrictness}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6">{insight.content}</p>

            <div className="mt-4 grid gap-2 border-t border-border pt-3 text-xs">
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Coffee className="size-3.5" />
                Canteen:
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`size-3 ${i <= Math.round(insight.canteenRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                  <strong className="ml-1 text-foreground">{insight.canteenRating.toFixed(1)}</strong>
                </span>
              </p>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                Placement support: {insight.placementSupport}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
