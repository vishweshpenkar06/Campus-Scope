import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, MapPin, Star } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { prisma } from '@/lib/prisma'
import { demoColleges } from '@/lib/demo-data'
import { formatINR } from '@/lib/format'
import { SITE_URL, collegeJsonLd, collegeSlug, parseCollegeSlug } from '@/lib/seo'
import { SourceBadge } from '@/components/data/SourceBadge'
import { FreshnessWarning } from '@/components/data/FreshnessWarning'
import type { CutoffRecord } from '@/lib/types'

export const dynamic = 'force-dynamic'

type PageCollege = {
  id: number
  name: string
  location: string
  fees: number
  rating: number
  overview: string
  websiteUrl: string
  cutoffs: CutoffRecord[]
  placements: Array<{ year: number; avgPackage: number; placementRate: number }>
}

async function loadCollege(id: number): Promise<PageCollege | null> {
  try {
    const college = await prisma.college.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        location: true,
        fees: true,
        rating: true,
        overview: true,
        websiteUrl: true,
        cutoffs: {
          orderBy: [{ year: 'desc' }, { capRound: 'desc' }],
          select: {
            id: true,
            exam: true,
            capRound: true,
            category: true,
            branch: true,
            percentile: true,
            year: true,
            sourceName: true,
            sourceUrl: true,
            sourceDate: true,
            verifiedAt: true,
          },
        },
        placements: {
          orderBy: { year: 'desc' },
          take: 1,
          select: { year: true, avgPackage: true, placementRate: true },
        },
      },
    })
    return college
      ? {
          ...college,
          cutoffs: college.cutoffs.map((cutoff) => ({
            ...cutoff,
            sourceDate: cutoff.sourceDate?.toISOString() ?? null,
            verifiedAt: cutoff.verifiedAt?.toISOString() ?? null,
          })),
        }
      : null
  } catch {
    const demo = demoColleges.find((college) => college.id === id)
    if (!demo) return null
    return {
      id: demo.id,
      name: demo.name,
      location: demo.location,
      fees: demo.fees,
      rating: demo.rating,
      overview: demo.overview,
      websiteUrl: '',
      cutoffs: [],
      placements: demo.placements ?? [],
    }
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const id = parseCollegeSlug((await params).slug)
  if (!id) return { title: 'College not found — CampusScope' }
  const college = await loadCollege(id)
  if (!college) return { title: 'College not found — CampusScope' }
  const title = `${college.name} cutoffs, fees, placements — CampusScope`
  const description = `${college.name}, ${college.location}: verified cutoff trends, annual fees, and placement data with sources.`
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/colleges/${collegeSlug(college.id, college.name)}` },
    openGraph: { title, description, type: 'article' },
  }
}

export default async function ProgrammaticCollegePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ branch?: string; category?: string }>
}) {
  const id = parseCollegeSlug((await params).slug)
  if (!id) notFound()
  const college = await loadCollege(id)
  if (!college) notFound()

  const filters = await searchParams
  const cutoffs = college.cutoffs
    .filter((cutoff) => {
      if (filters.branch && !cutoff.branch.toLowerCase().includes(filters.branch.toLowerCase())) return false
      if (filters.category && cutoff.category !== filters.category) return false
      return true
    })
    .slice(0, 40)

  const latestPlacement = college.placements[0]

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-10 pb-28 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collegeJsonLd(college)) }}
        />

        <nav className="text-xs text-muted-foreground">
          <Link href="/explore" className="hover:text-primary">
            Explore
          </Link>{' '}
          / <span>{college.name}</span>
        </nav>

        <header className="mt-5 border-b border-border pb-7">
          <p className="eyebrow">College · Maharashtra admissions</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{college.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {college.location}
            <span className="mx-2">·</span>
            <Star className="size-4 fill-current text-amber-500" /> {college.rating.toFixed(1)}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/college/${college.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Full profile <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href={`/predictor?college=${college.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold"
            >
              Check my chance
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Annual tuition</p>
            <p className="mt-1 font-serif text-2xl font-semibold">{formatINR(college.fees)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest placement</p>
            <p className="mt-1 font-serif text-2xl font-semibold">
              {latestPlacement ? `${formatINR(Math.round(latestPlacement.avgPackage * 100000))}/yr` : 'Not recorded'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Placement rate</p>
            <p className="mt-1 font-serif text-2xl font-semibold">
              {latestPlacement ? `${latestPlacement.placementRate}%` : 'Not recorded'}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold">Cutoff table</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filters.branch || filters.category
                  ? `Filtered by ${[filters.branch, filters.category].filter(Boolean).join(' · ')}.`
                  : 'Latest recorded rows first. Each row carries its own source badge.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link href={`/colleges/${collegeSlug(college.id, college.name)}`} className="rounded-full border border-border px-2.5 py-1">
                All
              </Link>
              {['Computer Engineering', 'Information Technology', 'Mechanical Engineering'].map((branch) => (
                <Link
                  key={branch}
                  href={`/colleges/${collegeSlug(college.id, college.name)}?branch=${encodeURIComponent(branch)}`}
                  className="rounded-full border border-border px-2.5 py-1 hover:border-primary hover:text-primary"
                >
                  {branch}
                </Link>
              ))}
            </div>
          </div>

          {cutoffs.length ? (
            <div className="mt-4 grid gap-3">
              <FreshnessWarning sourceDate={cutoffs[0]?.sourceDate} />
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 font-medium text-muted-foreground">Exam</th>
                      <th className="p-3 font-medium text-muted-foreground">Round</th>
                      <th className="p-3 font-medium text-muted-foreground">Category</th>
                      <th className="p-3 font-medium text-muted-foreground">Branch</th>
                      <th className="p-3 font-medium text-muted-foreground">Cutoff</th>
                      <th className="p-3 font-medium text-muted-foreground">Year</th>
                      <th className="p-3 font-medium text-muted-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cutoffs.map((cutoff) => (
                      <tr key={cutoff.id} className="border-t border-border">
                        <td className="p-3">{cutoff.exam}</td>
                        <td className="p-3">{cutoff.capRound}</td>
                        <td className="p-3">{cutoff.category}</td>
                        <td className="p-3">{cutoff.branch}</td>
                        <td className="p-3 font-semibold tabular-nums">{cutoff.percentile.toFixed(2)}</td>
                        <td className="p-3 text-muted-foreground">{cutoff.year}</td>
                        <td className="p-3">
                          <SourceBadge
                            sourceName={cutoff.sourceName}
                            sourceUrl={cutoff.sourceUrl}
                            sourceDate={cutoff.sourceDate}
                            verifiedAt={cutoff.verifiedAt}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No cutoff rows for this filter. Try another branch or open the full profile.
            </p>
          )}
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">About {college.name}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{college.overview}</p>
        </section>
      </main>
    </AppShell>
  )
}
