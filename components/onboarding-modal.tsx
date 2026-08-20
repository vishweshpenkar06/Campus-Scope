'use client'

import { useState } from 'react'
import { GraduationCap, Stethoscope, ArrowRight, ArrowLeft, X, Target, Shield, TrendingUp } from 'lucide-react'
import type { OnboardingState } from '@/lib/types'

export function getOnboardingState(): OnboardingState | null {
  return null
}

export function saveOnboardingState(_state: OnboardingState) {
  // No-op: modal shows on every visit
}

type Step = 'stream' | 'exam' | 'preferences' | 'results'

export function OnboardingModal({ onComplete }: { onComplete: (state: OnboardingState) => void }) {
  const [step, setStep] = useState<Step>('stream')
  const [stream, setStream] = useState<OnboardingState['stream']>(null)
  const [exam, setExam] = useState<OnboardingState['exam']>(null)
  const [percentile, setPercentile] = useState('')
  const [category, setCategory] = useState('OPEN')
  const [branch, setBranch] = useState('Computer Science & Engineering')
  const [loading, setLoading] = useState(false)

  function selectStream(s: OnboardingState['stream']) {
    setStream(s)
    if (s === 'medical') return
    setStep('exam')
  }

  function selectExam(e: OnboardingState['exam']) {
    setExam(e)
    setStep('preferences')
  }

  async function submitPreferences() {
    setLoading(true)
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          percentile: Number(percentile),
          category,
          branch,
          exam,
        }),
      })
      const body = await response.json()
      if (response.ok) {
        setStep('results')
      }
    } catch {
      // Continue anyway
    } finally {
      setLoading(false)
    }
  }

  function complete() {
    const state: OnboardingState = {
      stream: 'engineering',
      exam,
      percentile: percentile ? Number(percentile) : null,
      category,
      branch,
    }
    saveOnboardingState(state)
    onComplete(state)
  }

  function skip() {
    const state: OnboardingState = { stream: 'engineering', exam: null, percentile: null, category: 'OPEN', branch: 'Computer Science & Engineering' }
    saveOnboardingState(state)
    onComplete(state)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-8 shadow-2xl">
        <button
          onClick={skip}
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
          aria-label="Skip"
        >
          <X className="size-5" />
        </button>

        {step === 'stream' && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="size-4" />
              Welcome to CampusScope
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
              Select Your Academic Stream
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Choose your stream to personalize college recommendations, cutoffs, and predictor results.
            </p>

            <div className="mt-8 grid gap-4">
              <button
                onClick={() => selectStream('engineering')}
                className="flex items-center gap-4 rounded-xl border border-border p-5 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="size-6" />
                </div>
                <div>
                  <div className="font-semibold">Engineering</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    JEE Main, MHT-CET, and 500+ engineering colleges
                  </div>
                </div>
                <ArrowRight className="ml-auto size-4 text-muted-foreground" />
              </button>

              <button
                disabled
                className="flex items-center gap-4 rounded-xl border border-border p-5 text-left opacity-60"
              >
                <div className="grid size-12 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Stethoscope className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    Medical
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Coming Soon
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    NEET Track — launching soon
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={skip}
              className="mt-6 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 'exam' && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="size-4" />
              Engineering Track
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
              Choose Your Entrance Exam
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your exam choice determines which cutoffs and predictions we show you.
            </p>

            <div className="mt-8 grid gap-4">
              <button
                onClick={() => selectExam('JEE')}
                className="flex items-center gap-4 rounded-xl border border-border p-5 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary font-serif text-lg font-bold">
                  J
                </div>
                <div>
                  <div className="font-semibold">JEE Main</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    All India Seats — NITS, IIITs, CFTIs, and private colleges
                  </div>
                </div>
                <ArrowRight className="ml-auto size-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => selectExam('CET')}
                className="flex items-center gap-4 rounded-xl border border-border p-5 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary font-serif text-lg font-bold">
                  C
                </div>
                <div>
                  <div className="font-semibold">MHT-CET</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    State Level Seats — Maharashtra engineering colleges
                  </div>
                </div>
                <ArrowRight className="ml-auto size-4 text-muted-foreground" />
              </button>
            </div>

            <button
              onClick={() => setStep('stream')}
              className="mt-6 flex items-center gap-1 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          </div>
        )}

        {step === 'preferences' && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="size-4" />
              {exam === 'JEE' ? 'JEE Main' : 'MHT-CET'} Track
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
              Your Preferences
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Enter your percentile and preferences to get personalized college recommendations.
            </p>

            <div className="mt-8 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Your Percentile
                <input
                  required
                  value={percentile}
                  onChange={(e) => setPercentile(e.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 92.5"
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="TFWS">TFWS</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Target Branch
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option>Computer Science & Engineering</option>
                    <option>Electronics & Communication</option>
                    <option>Mechanical Engineering</option>
                    <option>Information Technology</option>
                    <option>Electrical Engineering</option>
                    <option>Civil Engineering</option>
                  </select>
                </label>
              </div>

              <button
                onClick={submitPreferences}
                disabled={loading || !percentile}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Finding colleges…' : 'Get Recommendations'}
                <ArrowRight className="size-4" />
              </button>
            </div>

            <button
              onClick={() => setStep('exam')}
              className="mt-6 flex items-center gap-1 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          </div>
        )}

        {step === 'results' && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="size-4" />
              Your Recommendations
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
              Your Shortlist
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Based on your {exam} percentile of {percentile} in {category} category for {branch}.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-green-700">
                  <Shield className="size-5" />
                  Safe Match
                </div>
                <p className="mt-1 text-sm text-green-600">
                  Percentile ≥ Cutoff + 2.0% — High chance of admission
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-amber-700">
                  <Target className="size-5" />
                  Target Match
                </div>
                <p className="mt-1 text-sm text-amber-600">
                  Percentile within Cutoff ± 2.0% — Competitive but achievable
                </p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-red-700">
                  <TrendingUp className="size-5" />
                  Reach / Dream
                </div>
                <p className="mt-1 text-sm text-red-600">
                  Percentile between Cutoff - 5.0% and Cutoff - 2.0% — Aspirational
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={complete}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Explore Colleges
                <ArrowRight className="size-4" />
              </button>
            </div>

            <button
              onClick={() => setStep('preferences')}
              className="mt-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Change preferences
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
