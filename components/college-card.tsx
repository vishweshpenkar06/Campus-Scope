'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, GitCompareArrows, Star, Home, Wifi, Building2 } from 'lucide-react'
import { formatINR, formatRating, parseFacilities } from '@/lib/format'
import { useCompare } from './compare-context'
import type { CollegeCard as College, GooglePlaceData } from '@/lib/types'

export function CollegeCard({ college }: { college: College }) {
  const { items, toggle } = useCompare()
  const selected = items.some((item) => item.id === college.id)
  const [googleData, setGoogleData] = useState<GooglePlaceData | null>(null)

  const facilities = parseFacilities(college.facilities)

  useEffect(() => {
    fetch(`/api/google-places?name=${encodeURIComponent(college.name)}&location=${encodeURIComponent(college.location)}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.data) setGoogleData(body.data)
      })
      .catch(() => {})
  }, [college.name, college.location])

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative h-40 bg-muted">
        {googleData?.photos?.[0] ? (
          <img
            src={googleData.photos[0]}
            alt={college.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden')
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="size-12 text-muted-foreground/30" />
          </div>
        )}
        {googleData?.rating && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {googleData.rating.toFixed(1)}
            <span className="text-white/60">({googleData.totalReviews.toLocaleString()})</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span>{college.location}</span>
          <span className="size-1 bg-primary" aria-hidden="true" />
          <span>Engineering</span>
        </div>

        <Link href={`/college/${college.id}`} className="group/title inline-flex items-start gap-2">
          <h2 className="font-serif text-xl font-semibold leading-tight tracking-tight group-hover/title:text-primary">
            {college.name}
          </h2>
          <ArrowUpRight className="mt-0.5 size-4 text-primary opacity-0 transition group-hover/title:opacity-100" />
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{college.overview}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {college.hostelAvailable && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium">
              <Home className="size-2.5" />
              Hostel
            </span>
          )}
          {facilities.slice(0, 2).map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium"
            >
              {f === 'WiFi' && <Wifi className="size-2.5" />}
              {f}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Annual fees from</p>
            <p className="text-sm font-semibold">{formatINR(college.fees)}</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            {formatRating(college.rating)}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              toggle({
                id: college.id,
                name: college.name,
                location: college.location,
                rating: college.rating,
              })
            }}
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-xs font-semibold transition ${
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-foreground/15 hover:border-primary hover:text-primary'
            }`}
            aria-label={`${selected ? 'Remove' : 'Add'} ${college.name} ${selected ? 'from' : 'to'} comparison`}
          >
            <GitCompareArrows className="size-3" />
            {selected ? 'Added' : 'Compare'}
          </button>
        </div>
      </div>
    </article>
  )
}
