'use client'

import { useEffect, useState } from 'react'
import { Database, FileCheck2, GraduationCap, ShieldCheck } from 'lucide-react'

type Stats = { cutoffs: number; colleges: number; sources: number; years: number }

export function StatsStrip() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body) => setStats(body))
      .catch(() => setStats(null))
  }, [])

  if (!stats) return null

  const items = [
    { label: 'Official cutoff rows', value: stats.cutoffs.toLocaleString('en-IN'), icon: Database },
    { label: 'DTE institutes', value: stats.colleges.toLocaleString('en-IN'), icon: GraduationCap },
    { label: 'Admission years', value: String(stats.years), icon: FileCheck2 },
    { label: 'Source PDFs', value: String(stats.sources), icon: ShieldCheck },
  ]

  return (
    <section aria-label="Data coverage" className="border-b border-foreground/10 bg-card/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border/60 px-5 sm:grid-cols-4 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 bg-background px-4 py-4">
            <item.icon className="size-4 text-primary" />
            <div>
              <p className="font-serif text-xl font-semibold tabular-nums">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
