'use client'

import Link from 'next/link'
import { ArrowUpRight, GitCompareArrows, MapPin, Star } from 'lucide-react'
import { formatINR, formatRating } from '@/lib/format'
import { useCompare } from './compare-context'
import type { CollegeCard as College } from '@/lib/types'

export function CollegeCard({ college }: { college: College }) {
  const { items, toggle } = useCompare()
  const selected = items.some((item) => item.id === college.id)
  return (
    <article className="group border-t border-foreground/15 py-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><span>{college.location}</span><span className="size-1 bg-primary" aria-hidden="true" /><span>Engineering</span></div>
          <Link href={`/college/${college.id}`} className="group/title inline-flex items-start gap-2"><h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight group-hover/title:text-primary">{college.name}</h2><ArrowUpRight className="mt-1 size-5 text-primary opacity-0 transition group-hover/title:opacity-100" /></Link>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{college.overview}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold"><Star className="size-4 fill-current text-amber-600" /> {formatRating(college.rating)} <span className="font-normal text-muted-foreground">out of 5</span></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm">
        <p><span className="text-muted-foreground">Annual fees from </span><strong>{formatINR(college.fees)}</strong></p>
        <button onClick={() => toggle({ id: college.id, name: college.name, location: college.location, rating: college.rating })} className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-semibold transition ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/15 hover:border-primary hover:text-primary'}`} aria-label={`${selected ? 'Remove' : 'Add'} ${college.name} ${selected ? 'from' : 'to'} comparison`}><GitCompareArrows className="size-3.5" /> {selected ? 'In comparison' : 'Add to compare'}</button>
      </div>
    </article>
  )
}
