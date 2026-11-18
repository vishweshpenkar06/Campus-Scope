'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { MapPin, Star, GitCompareArrows, RotateCcw, Home, ExternalLink, Phone, X } from 'lucide-react'
import { useCompare } from './compare-context'
import { formatINR, formatPackage, formatRating, formatROI, parseFacilities } from '@/lib/format'
import { RoiBadge } from './roi-badge'
import { ShareActions } from './share-actions'
import { FinancialCard } from './financial-card'
import { CommuteChecker } from './commute-checker'
import { CapRoundTrends } from './cap-round-trends'
import { SeatMatrix } from './seat-matrix'
import { CampusInsights } from './campus-insights'
import { CampusMap } from './campus-map'
import { SaveCollegeButton } from './save-college-button'
import { SourceBadge } from './data/SourceBadge'
import { FreshnessWarning } from './data/FreshnessWarning'
import { ChanceCard } from './share/ChanceCard'
import type { CollegeDetail as Detail, GooglePlaceData } from '@/lib/types'

export function CollegeDetail({ id }: { id: string }) {
  const [college, setCollege] = useState<Detail | null>(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState('overview')
  const [googleData, setGoogleData] = useState<GooglePlaceData | null>(null)
  const { items, toggle } = useCompare()

  const load = useCallback(
    () =>
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
      .catch(() => setError(true)),
    [id]
  )

  useEffect(() => {
    load()
  }, [load])

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
    ...(college.courses.length ? [{ id: 'courses', label: `Courses (${college.courses.length})` }] : []),
    ...(college.placements.length ? [{ id: 'placements', label: `Placements (${college.placements.length})` }] : []),
    { id: 'cutoffs', label: `Cutoffs (${college.cutoffs.length})` },
    ...(college.capRoundTrends?.length ? [{ id: 'trends', label: 'CAP Trends' }] : []),
    ...(college.seatMatrices?.length ? [{ id: 'seats', label: 'Seat Matrix' }] : []),
    ...(college.reviews.length ? [{ id: 'reviews', label: `Reviews (${college.reviews.length})` }] : []),
    ...(college.campusInsights?.length ? [{ id: 'insights', label: 'Senior Talk' }] : []),
    { id: 'campus', label: 'Campus & Travel' },
    ...(googleData ? [{ id: 'google', label: `Google (${googleData.totalReviews.toLocaleString()} reviews)` }] : []),
  ]

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 pb-28">
      {googleData?.photos?.[0] && (
        <div className="relative mb-8 h-64 overflow-hidden rounded-xl bg-muted md:h-80">
          <Image
            src={googleData.photos[0]}
            alt={college.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
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

          {college.instituteCode && (
            <div className="mt-4 max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
              <strong>Official DTE data.</strong> Institute code {college.instituteCode}. Cutoffs are
              verified from public Maharashtra CAP PDFs (2023–2026). Fees, placements, and reviews
              are not yet verified for this institute.
            </div>
          )}

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
            <div className="mt-2">
              <SaveCollegeButton collegeId={college.id} branches={college.courses.map((c) => c.name)} />
            </div>
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
        <div className="hidden w-full print:block">
          <h2 className="font-serif text-3xl font-bold">{college.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {college.location}
            {college.accreditation ? ` · ${college.accreditation}` : ''}
            {college.establishedYear ? ` · Est. ${college.establishedYear}` : ''}
            {' · campusscope'}
          </p>
        </div>
        {college.rating > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            <Star className="mr-1 inline size-4 fill-amber-500 text-amber-500" />
            {formatRating(college.rating)} / 5
          </div>
        )}
        {college.fees > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            {formatINR(college.fees)} / year
          </div>
        )}
        {latestPlacement && (
          <RoiBadge avgPackageInr={latestPlacement.avgPackage * 100000} fees={college.fees} hostelFees={college.hostelAvailable ? college.hostelFees : 0} />
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
        {college.courses.length > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            {college.courses.length} {college.courses.length === 1 ? 'course' : 'courses'}
          </div>
        )}
        {college.reviews.length > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
            {college.reviews.length} {college.reviews.length === 1 ? 'review' : 'reviews'}
          </div>
        )}
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
            {college.fees > 0 ? (
              <FinancialCard
                fees={college.fees}
                hostelFees={college.hostelFees}
                hostelAvailable={college.hostelAvailable}
                cautionDeposit={college.cautionDeposit}
                eligibleScholarships={college.eligibleScholarships}
                policy={{
                  ebcConcessionPct: college.ebcConcessionPct ?? 50,
                  tfwsConcessionPct: college.tfwsConcessionPct ?? 100,
                  scStConcessionPct: college.scStConcessionPct ?? 100,
                  minorityConcessionPct: college.minorityConcessionPct ?? 30,
                }}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                Tuition, hostel, and scholarship data are not verified for this institute yet.
                Use the official fee brochure before budgeting.
              </div>
            )}
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
            <>
              <CutoffTable cutoffs={college.cutoffs} collegeId={college.id} />
              <ChanceCard collegeId={college.id} collegeName={college.name} cutoffs={college.cutoffs} />
            </>
          ) : (
            <Empty text="No cutoff data available" />
          ))}

        {tab === 'trends' && college.capRoundTrends && (
          <CapRoundTrends trends={college.capRoundTrends} />
        )}

        {tab === 'seats' && college.seatMatrices && <SeatMatrix matrices={college.seatMatrices} />}

        {tab === 'insights' && college.campusInsights && (
          <CampusInsights insights={college.campusInsights} />
        )}

        {tab === 'campus' && <CampusMap collegeName={college.name} location={college.location} />}


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
              <div key={i} className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <Image
                  src={photo}
                  alt={`Campus photo ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition hover:scale-105"
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
                    <Image
                      src={review.avatar}
                      alt={review.author}
                      width={40}
                      height={40}
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

function CutoffTable({ cutoffs, collegeId }: { cutoffs: Detail['cutoffs']; collegeId: number }) {
  const exams = [...new Set(cutoffs.map((c) => c.exam))]
  const defaultExam = exams.includes('CET') ? 'CET' : (exams[0] ?? 'CET')
  const yearsFor = (selectedExam: string) =>
    [...new Set(cutoffs.filter((c) => c.exam === selectedExam).map((c) => c.year))].sort((a, b) => b - a)
  const defaultYear = yearsFor(defaultExam)[0] ?? new Date().getFullYear()
  const roundsFor = (selectedExam: string, selectedYear: number) =>
    [...new Set(cutoffs.filter((c) => c.exam === selectedExam && c.year === selectedYear).map((c) => c.capRound))].sort((a, b) => b - a)
  const categoryFor = (selectedExam: string, selectedYear: number) => {
    const available = [...new Set(cutoffs.filter((c) => c.exam === selectedExam && c.year === selectedYear).map((c) => c.category))]
    return available.includes('OPEN') ? 'OPEN' : (available[0] ?? 'OPEN')
  }

  const [exam, setExam] = useState(defaultExam)
  const [year, setYear] = useState(defaultYear)
  const [round, setRound] = useState<number>(roundsFor(defaultExam, defaultYear)[0] ?? 1)
  const [category, setCategory] = useState<string>(categoryFor(defaultExam, defaultYear))
  const [level, setLevel] = useState('All')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const years = yearsFor(exam)
  const rounds = roundsFor(exam, year)
  const categories = [...new Set(cutoffs.filter((c) => c.exam === exam && c.year === year).map((c) => c.category))].sort()
  const levels = [...new Set(cutoffs.filter((c) => c.exam === exam && c.year === year && c.level).map((c) => c.level))].sort() as string[]

  function changeExam(nextExam: string) {
    const nextYear = yearsFor(nextExam)[0] ?? year
    setExam(nextExam)
    setYear(nextYear)
    setRound(roundsFor(nextExam, nextYear)[0] ?? 1)
    setCategory(categoryFor(nextExam, nextYear))
    setLevel('All')
  }

  function changeYear(nextYear: number) {
    setYear(nextYear)
    setRound(roundsFor(exam, nextYear)[0] ?? 1)
    setCategory(categoryFor(exam, nextYear))
    setLevel('All')
  }

  const filtered = cutoffs
    .filter((c) => c.year === year && c.exam === exam && c.capRound === round && c.category === category)
    .filter((c) => level === 'All' || c.level === level)
    .sort((a, b) => a.branch.localeCompare(b.branch) || b.percentile - a.percentile)

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select value={exam} onChange={(e) => changeExam(e.target.value)} aria-label="Exam" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {exams.map((e) => <option key={e}>{e}</option>)}
        </select>
        <select value={year} onChange={(e) => changeYear(Number(e.target.value))} aria-label="Year" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={round} onChange={(e) => setRound(Number(e.target.value))} aria-label="CAP round" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {rounds.map((r) => <option key={r} value={r}>Round {r}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Seat level" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="All">All seat levels</option>
          {levels.map((l) => <option key={l}>{l}</option>)}
        </select>
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {filtered.length} row{filtered.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          Report an error
        </button>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="correction-title">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="correction-title" className="font-serif text-xl font-semibold">Report a data error</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {year} · Round {round} · {category} · {level === 'All' ? 'all levels' : level}
                </p>
              </div>
              <button onClick={() => setReportOpen(false)} aria-label="Close correction form" className="rounded p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            {reportState === 'sent' ? (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Thanks — the report is in the review queue. If the source confirms the issue, the row
                will be corrected or hidden.
              </p>
            ) : (
              <form
                onSubmit={async (event) => {
                  event.preventDefault()
                  setReportState('sending')
                  try {
                    const response = await fetch('/api/corrections', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        collegeId,
                        message: `[${year} R${round} ${category} ${level}] ${reportMessage}`,
                      }),
                    })
                    if (!response.ok) throw new Error()
                    setReportState('sent')
                  } catch {
                    setReportState('error')
                  }
                }}
                className="mt-4 grid gap-3"
              >
                <label className="grid gap-1 text-xs font-semibold">
                  What is wrong?
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={4}
                    value={reportMessage}
                    onChange={(event) => setReportMessage(event.target.value)}
                    placeholder="e.g. The 2026 Round 4 OPEN cutoff should be 98.21, not 98.12."
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                {reportState === 'error' && <p className="text-sm text-red-700">Could not submit. Try again.</p>}
                <button disabled={reportState === 'sending'} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {reportState === 'sending' ? 'Sending…' : 'Submit report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {filtered.length ? (
        <div className="grid gap-3">
          <FreshnessWarning sourceDate={filtered[0]?.sourceDate} />
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Branch</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Level</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Cutoff %</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Rank</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Stage</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-4 text-sm">
                      <span className="font-medium">{c.branch}</span>
                      {c.branchCode && <span className="ml-2 font-mono text-[10px] text-muted-foreground">{c.branchCode}</span>}
                    </td>
                    <td className="p-4 text-sm">
                      <span className="font-medium">{c.category}</span>
                      {c.categoryCode && <span className="ml-2 text-[10px] text-muted-foreground">{c.categoryCode}</span>}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{c.level ?? '—'}</td>
                    <td className="p-4 text-sm font-semibold tabular-nums">{c.percentile.toFixed(2)}</td>
                    <td className="p-4 text-sm tabular-nums">{c.rank ?? '—'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c.stage ?? '—'}</td>
                    <td className="p-4">
                      <SourceBadge sourceName={c.sourceName} sourceUrl={c.sourceUrl} sourceDate={c.sourceDate} verifiedAt={c.verifiedAt} />
                      {c.sourcePage && <span className="ml-2 text-[10px] text-muted-foreground">p.{c.sourcePage}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 300 && <p className="text-xs text-muted-foreground">Showing first 300 of {filtered.length} rows. Narrow the filters for the rest.</p>}
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
