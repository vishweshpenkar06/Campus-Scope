'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, ChevronRight, ExternalLink } from 'lucide-react'
import type { DeadlineRecord } from '@/lib/types'

const categoryColors: Record<string, string> = {
  Registration: 'bg-primary/10 text-primary',
  'Merit List': 'bg-amber-100 text-amber-700',
  'Option Form': 'bg-purple-100 text-purple-700',
  CAP: 'bg-green-100 text-green-700',
  'Spot Round': 'bg-red-100 text-red-700',
}

export function DeadlineBanner() {
  const [deadlines, setDeadlines] = useState<DeadlineRecord[]>([])

  useEffect(() => {
    fetch('/api/deadlines')
      .then((r) => r.json())
      .then((body) => setDeadlines(body.data ?? []))
      .catch(() => {})
  }, [])

  if (!deadlines.length) return null

  return (
    <div className="border-b border-foreground/10 bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 lg:px-8">
        <span className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-primary">
          <CalendarClock className="size-4" />
          <span className="hidden sm:inline">Admission tracker</span>
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-0.5">
          {deadlines.map((event, index) => {
            const date = new Date(event.eventDate)
            const daysAway = Math.ceil((date.getTime() - Date.now()) / 86400000)
            return (
              <Link
                key={event.id}
                href={event.officialLink || '/option-form'}
                target={event.officialLink ? '_blank' : undefined}
                rel={event.officialLink ? 'noopener noreferrer' : undefined}
                className="group flex shrink-0 items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 transition hover:border-primary"
              >
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${categoryColors[event.category] ?? 'bg-muted text-muted-foreground'}`}>
                  {event.category}
                </span>
                <span className="text-sm font-medium">{event.title}</span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {daysAway <= 30 && (
                    <strong className="ml-1 text-destructive">· {daysAway}d left</strong>
                  )}
                </span>
                {index === deadlines.length - 1 && <ExternalLink className="size-3 opacity-0 group-hover:opacity-100" />}
                <ChevronRight className="size-3 text-muted-foreground/50" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
