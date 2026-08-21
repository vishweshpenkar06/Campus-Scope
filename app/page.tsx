'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, Database } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { CollegeExplorer } from '@/components/college-explorer'
import { Predictor } from '@/components/predictor'
import { OnboardingModal, getOnboardingState } from '@/components/onboarding-modal'
import { FilterBanner } from '@/components/filter-banner'
import { AutoAllotment } from '@/components/auto-allotment'
import type { OnboardingState } from '@/lib/types'

export default function Page() {
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const existing = getOnboardingState()
    if (existing?.exam && existing?.percentile) {
      setOnboarding(existing)
    } else {
      setShowModal(true)
    }
  }, [])

  function handleOnboardingComplete(state: OnboardingState) {
    setOnboarding(state)
    setShowModal(false)
    if (state.exam && state.percentile) {
      setTimeout(() => {
        document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  function handleEditExam() {
    setShowModal(true)
  }

  const hasResults = onboarding?.exam && onboarding?.percentile

  return (
    <AppShell>
      {showModal && <OnboardingModal onComplete={handleOnboardingComplete} />}
      {hasResults && <FilterBanner onboarding={onboarding!} onEdit={handleEditExam} />}
      <main>
        <section className="border-b border-foreground/10 px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="eyebrow">A research desk for your next decision</p>
              <h1 className="mt-5 max-w-4xl font-serif text-6xl font-semibold leading-[.98] tracking-[-.04em] sm:text-8xl">
                Choose a college with your eyes open.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
                CampusScope brings the details that matter—fees, courses, placements, and student
                perspective—into one calm place to do your research.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#recommendations"
                  className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  {hasResults ? 'See your matches' : 'Start with the directory'}{' '}
                  <ArrowDown className="size-4" />
                </Link>
                <Link
                  href="#predictor"
                  className="inline-flex items-center gap-2 border border-foreground/15 px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
                >
                  See your starting point <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <aside className="border-l-2 border-primary pl-6">
              <p className="font-serif text-2xl leading-tight">
                Not a ranking. A clearer way to make a shortlist.
              </p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Use the directory to gather options, read the context behind the numbers, then compare
                only the colleges that still feel right.
              </p>
              <div className="mt-7 flex items-center gap-3 border-t border-foreground/10 pt-4 text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">
                <Database className="size-4 text-primary" /> Live catalog · Neon backed
              </div>
            </aside>
          </div>
        </section>

        {hasResults && (
          <section id="recommendations" className="scroll-mt-8 px-5 py-20 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex flex-col gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">01 · Your Matches</p>
                  <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
                    Colleges for you
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Based on {onboarding!.exam === 'JEE' ? 'JEE Main' : 'MHT-CET'}{' '}
                    {onboarding!.percentile}% · {onboarding!.category} ·{' '}
                    {onboarding!.branch === 'All Branches' ? 'All Branches' : onboarding!.branch}
                  </p>
                </div>
              </div>
              <AutoAllotment onboarding={onboarding!} />
            </div>
          </section>
        )}

        <section id="explore" className="scroll-mt-8 px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">{hasResults ? '02' : '01'} · Directory</p>
                <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
                  Find the right set of options
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Search by place, budget, and signal. Start broad, then let the details narrow the
                field.
              </p>
            </div>
            <CollegeExplorer defaultExam={onboarding?.exam || undefined} />
          </div>
        </section>

        <section
          id="predictor"
          className="scroll-mt-8 border-y border-foreground/10 bg-primary px-5 py-20 text-primary-foreground lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-foreground/65">
                {hasResults ? '03' : '02'} · Shortlist check
              </p>
              <h2 className="mt-4 font-serif text-5xl font-semibold leading-none tracking-tight">
                A useful first read, not a promise.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-primary-foreground/75">
                Enter your percentile and preferences to see how your starting point lines up with the
                catalog. The result is directional—use it to begin research, never as an admissions
                guarantee.
              </p>
            </div>
            <Predictor defaultExam={onboarding?.exam || undefined} />
          </div>
        </section>

        <footer className="px-5 py-10 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="font-serif text-lg font-semibold text-foreground">CampusScope</span>
            <span>Built for thoughtful college research · Track A</span>
          </div>
        </footer>
      </main>
    </AppShell>
  )
}
