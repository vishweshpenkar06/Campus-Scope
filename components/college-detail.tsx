'use client'

import { useEffect, useState } from 'react'
import { MapPin, Star, GitCompareArrows, RotateCcw } from 'lucide-react'
import { useCompare } from './compare-context'
import { formatINR, formatPackage, formatRating } from '@/lib/format'
import type { CollegeDetail as Detail } from '@/lib/types'

export function CollegeDetail({ id }: { id: string }) {
  const [college, setCollege] = useState<Detail | null>(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState('overview')
  const { items, toggle } = useCompare()

  const load = () =>
    fetch(`/api/colleges/${id}`)
      .then(async (r) => {
        if (r.status === 404) throw new Error('not-found')
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setCollege)
      .catch(() => setError(true))

  useEffect(() => {
    load()
  }, [id])

  if (error)
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">College unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find this college or load its details.
        </p>
        <button
          onClick={() => {
            setError(false)
            load()
          }}
          className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <RotateCcw className="mr-2 inline size-4" />
          Retry
        </button>
      </div>
    )

  if (!college)
    return (
      <div className="mx-auto max-w-7xl px-5 py-20">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    )

  const selected = items.some((item) => item.id === college.id)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: `Courses (${college.courses.length})` },
    { id: 'placements', label: `Placements (${college.placements.length})` },
    { id: 'reviews', label: `Reviews (${college.reviews.length})` },
  ]

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 pb-28">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">College profile</p>
          <h1 className="mt-2 max-w-3xl text-balance text-4xl font-bold tracking-tight">
            {college.name}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            {college.location}
          </p>
        </div>
        <button
          onClick={() =>
            toggle({
              id: college.id,
              name: college.name,
              location: college.location,
              rating: college.rating,
            })
          }
          className="flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary"
        >
          <GitCompareArrows className="size-4" />
          {selected ? 'Added to compare' : 'Add to compare'}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          <Star className="mr-1 inline size-4 fill-amber-500 text-amber-500" />
          {formatRating(college.rating)} / 5
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          {formatINR(college.fees)} / year
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          {college.courses.length} courses
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          {college.reviews.length} reviews
        </div>
      </div>

      <div className="mt-8 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'overview' && (
          <div className="prose max-w-none">
            <p className="text-base leading-7 text-muted-foreground">{college.overview}</p>
          </div>
        )}

        {tab === 'courses' &&
          (college.courses.length ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Course</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Duration</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Annual Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {college.courses.map((course) => (
                    <tr key={course.id} className="border-t border-border">
                      <td className="p-4 text-sm font-medium">{course.name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{course.duration}</td>
                      <td className="p-4 text-sm">{formatINR(course.fees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="No course data available" />
          ))}

        {tab === 'placements' &&
          (college.placements.length ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Year</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Avg Package</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">
                      Highest Package
                    </th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">
                      Placement Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {college.placements.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-4 text-sm font-medium">{p.year}</td>
                      <td className="p-4 text-sm">{formatPackage(p.avgPackage)}</td>
                      <td className="p-4 text-sm">{formatPackage(p.highestPackage)}</td>
                      <td className="p-4 text-sm">{p.placementRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="No placement data available" />
          ))}

        {tab === 'reviews' &&
          (college.reviews.length ? (
            <div className="space-y-4">
              {college.reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{review.author}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="No reviews yet" />
          ))}
      </div>
    </main>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
      {text}
    </div>
  )
}
