'use client'

import { useEffect, useState } from 'react'
import { MapPin, Star, GitCompareArrows, RotateCcw, Home, ExternalLink, Phone, Building2 } from 'lucide-react'
import { useCompare } from './compare-context'
import { formatINR, formatPackage, formatRating, formatROI, parseFacilities } from '@/lib/format'
import { RoiBadge } from './roi-badge'
import { ShareActions } from './share-actions'
import { FinancialCard } from './financial-card'
import { CommuteChecker } from './commute-checker'
import { CapRoundTrends } from './cap-round-trends'
import { SeatMatrix } from './seat-matrix'
import { CampusInsights } from './campus-insights'
import type { CollegeDetail as Detail, GooglePlaceData } from '@/lib/types'

export function CollegeDetail({ id }: { id: string }) {
  const [college, setCollege] = useState<Detail | null>(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState('overview')
  const [googleData, setGoogleData] = useState<GooglePlaceData | null>(null)
  const { items, toggle } = useCompare()

  const load = () =>
    fetch(`/api/colleges/${id}`)
      .then(async (r) => {
        if (r.status === 404) throw new Error('not-found')
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        setCollege(data)
        fetch(`/api/google-places?name=${encodeURIComponent(data.name)}&location=${encodeURIComponent(data.location)}`)
          .then((r) => r.json())
          .then((body) => {
            if (body.data) setGoogleData(body.data)
          })
          .catch(() => {})
      })
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
  const facilities = parseFacilities(college.facilities)
  const latestPlacement = college.placements[0]
  // ROI denominator includes hostel across 4 years, matching the Financial Breakdown card
  const totalFees = college.fees * 4 + (college.hostelAvailable ? college.hostelFees * 4 : 0)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: `Courses (${college.courses.length})` },
    { id: 'placements', label: `Placements (${college.placements.length})` },
    { id: 'cutoffs', label: `Cutoffs (${college.cutoffs.length})` },
    ...(college.capRoundTrends?.length ? [{ id: 'trends', label: 'CAP Trends' }] : []),
    ...(college.seatMatrices?.length ? [{ id: 'seats', label: 'Seat Matrix' }] : []),
    { id: 'reviews', label: `Reviews (${college.reviews.length})` },
    ...(college.campusInsights?.length ? [{ id: 'insights', label: 'Senior Talk' }] : []),
    ...(googleData ? [{ id: 'google', label: `Google (${googleData.totalReviews.toLocaleString()} reviews)` }] : []),
  ]

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 pb-28">
      {googleData?.photos?.[0] && (
        <div className="mb-8 overflow-hidden rounded-xl bg-muted">
          <img
            src={googleData.photos[0]}
            alt={college.name}
            className="h-64 w-full object-cover md:h-80"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

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

          <div className="mt-4 flex flex-wrap gap-2">
            {college.establishedYear > 0 && (
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                Est. {college.establishedYear}
              </span>
            )}
            {college.campusSize && (
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                {college.campusSize}
              </span>
            )}
            {college.accreditation && (
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {college.accreditation}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {college.websiteUrl && (
              <a
                href={college.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <ExternalLink className="size-4" />
                Official Website
              </a>
            )}
            {college.admissionUrl && (
              <a
                href={college.admissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
              >
                <ExternalLink className="size-4" />
                Admission Portal
              </a>
            )}
          </div>

          {googleData && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              {googleData.rating && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-500 text-amber-500" />
                  {googleData.rating.toFixed(1)} on Google
                  <span className="text-muted-foreground">({googleData.totalReviews.toLocaleString()} reviews)</span>
                </span>
              )}
              {googleData.phone && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="size-3.5" />
                  {googleData.phone}
                </span>
              )}
            </div>
          )}

          <div className="mt-5 print:hidden">
            <ShareActions college={college} />
          </div>
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

      <div id="print-summary" className="mt-8 flex flex-wrap gap-3">
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          <Star className="mr-1 inline size-4 fill-amber-500 text-amber-500" />
          {formatRating(college.rating)} / 5
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          {formatINR(college.fees)} / year
        </div>
        {latestPlacement && (
          <RoiBadge avgPackageInr={latestPlacement.avgPackage} fees={college.fees} hostelFees={college.hostelAvailable ? college.hostelFees : 0} />
        )}
        {college.nirfRank ? (
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            NIRF Rank #{college.nirfRank}
          </div>
        ) : null}
        {college.autonomous && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            Autonomous
          </div>
        )}
        {college.studentFacultyRatio && (
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            Faculty ratio {college.studentFacultyRatio}
          </div>
        )}
        {college.hostelAvailable && (
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            <Home className="mr-1 inline size-4" />
            Hostel: {formatINR(college.hostelFees)}/yr
          </div>
        )}
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          {college.courses.length} courses
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          {college.reviews.length} reviews
        </div>
      </div>

      {facilities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {facilities.map((f) => (
            <span
              key={f}
              className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
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
          <div className="grid gap-6">
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">{college.overview}</p>
            <FinancialCard
              fees={college.fees}
              hostelFees={college.hostelFees}
              hostelAvailable={college.hostelAvailable}
              cautionDeposit={college.cautionDeposit}
              eligibleScholarships={college.eligibleScholarships}
            />
            <CommuteChecker collegeName={college.name} location={college.location} />
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
                    <th className="p-4 text-sm font-medium text-muted-foreground">ROI Index</th>
                  </tr>
                </thead>
                <tbody>
                  {college.placements.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-4 text-sm font-medium">{p.year}</td>
                      <td className="p-4 text-sm">{formatPackage(p.avgPackage)}</td>
                      <td className="p-4 text-sm">{formatPackage(p.highestPackage)}</td>
                      <td className="p-4 text-sm">{p.placementRate}%</td>
                      <td className="p-4 text-sm font-medium text-green-700">
                        {formatROI(p.avgPackage * 100000, totalFees)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="No placement data available" />
          ))}

        {tab === 'cutoffs' &&
          (college.cutoffs.length ? (
            <CutoffTable cutoffs={college.cutoffs} />
          ) : (
            <Empty text="No cutoff data available" />
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

        {tab === 'google' && googleData && (
          <GoogleReviewsSection googleData={googleData} />
        )}
      </div>
    </main>
  )
}

function GoogleReviewsSection({ googleData }: { googleData: GooglePlaceData }) {
  return (
    <div>
      {googleData.address && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Address</p>
            <p className="text-muted-foreground">{googleData.address}</p>
          </div>
        </div>
      )}

      {googleData.photos.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Campus Photos</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {googleData.photos.map((photo, i) => (
              <div key={i} className="aspect-video overflow-hidden rounded-lg bg-muted">
                <img
                  src={photo}
                  alt={`Campus photo ${i + 1}`}
                  className="h-full w-full object-cover transition hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {googleData.reviews.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Google Reviews</h3>
          <div className="space-y-4">
            {googleData.reviews.map((review, i) => (
              <div key={i} className="rounded-xl border border-border p-5">
                <div className="flex items-start gap-3">
                  {review.avatar ? (
                    <img
                      src={review.avatar}
                      alt={review.author}
                      className="size-10 rounded-full"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {review.author.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{review.author}</span>
                      <span className="text-xs text-muted-foreground">{review.time}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`size-3.5 ${j < review.rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                    {review.text && (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.text}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CutoffTable({ cutoffs }: { cutoffs: Detail['cutoffs'] }) {
  const [exam, setExam] = useState<string>(cutoffs[0]?.exam || 'JEE')
  const [round, setRound] = useState<number>(cutoffs[0]?.capRound || 1)
  const [category, setCategory] = useState<string>(cutoffs[0]?.category || 'OPEN')

  const filtered = cutoffs.filter(
    (c) => c.exam === exam && c.capRound === round && c.category === category
  )

  const exams = [...new Set(cutoffs.map((c) => c.exam))]
  const rounds = [...new Set(cutoffs.map((c) => c.capRound))].sort()
  const categories = [...new Set(cutoffs.map((c) => c.category))]

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          {exams.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <select
          value={round}
          onChange={(e) => setRound(Number(e.target.value))}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          {rounds.map((r) => (
            <option key={r} value={r}>
              Round {r}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-sm font-medium text-muted-foreground">Branch</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Cutoff Percentile</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Year</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-4 text-sm font-medium">{c.branch}</td>
                  <td className="p-4 text-sm">{c.percentile.toFixed(2)}</td>
                  <td className="p-4 text-sm text-muted-foreground">{c.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="No cutoffs match the selected filters" />
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
      {text}
    </div>
  )
}
