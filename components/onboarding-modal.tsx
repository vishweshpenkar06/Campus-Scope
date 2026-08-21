'use client'

import { useState } from 'react'
import { GraduationCap, ArrowRight, ArrowLeft, X, Loader2 } from 'lucide-react'
import type { OnboardingState } from '@/lib/types'

const STORAGE_KEY = 'campusscope-onboarding'

export function getOnboardingState(): OnboardingState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveOnboardingState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearOnboardingState() {
  localStorage.removeItem(STORAGE_KEY)
}

export function OnboardingModal({ onComplete }: { onComplete: (state: OnboardingState) => void }) {
  const [step, setStep] = useState<'exam' | 'preferences'>('exam')
  const [exam, setExam] = useState<'JEE' | 'CET' | null>(null)
  const [percentile, setPercentile] = useState('')
  const [category, setCategory] = useState('OPEN')
  const [branch, setBranch] = useState('All Branches')
  const [loading, setLoading] = useState(false)

  function selectExam(e: 'JEE' | 'CET') {
    setExam(e)
    setStep('preferences')
  }

  async function submit() {
    setLoading(true)
    const state: OnboardingState = {
      stream: 'engineering',
      exam,
      percentile: percentile ? Number(percentile) : null,
      category,
      branch,
    }
    saveOnboardingState(state)
    onComplete(state)
    setLoading(false)
  }

  function skip() {
    const state: OnboardingState = {
      stream: 'engineering',
      exam: null,
      percentile: null,
      category: 'OPEN',
      branch: 'All Branches',
    }
    saveOnboardingState(state)
    onComplete(state)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-2xl">
        <button
          onClick={skip}
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
          aria-label="Skip"
        >
          <X className="size-5" />
        </button>

        {step === 'exam' && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="size-4" />
              Welcome to CampusScope
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
              Select your Entrance Exam
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your exam choice determines which cutoffs and college recommendations we show you.
            </p>

            <div className="mt-8 grid gap-3">
              <button
                onClick={() => selectExam('JEE')}
                className="flex items-center gap-4 rounded-xl border border-border p-5 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div className="grid size-12 place-items-center rounded-lg bg-primary/10 font-serif text-lg font-bold text-primary">
                  J
                </div>
                <div>
                  <div className="font-semibold">JEE Main</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    All India — NITs, IIITs, CFTIs, private colleges
                  </div>
                </div>
                <ArrowRight className="ml-auto size-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => selectExam('CET')}
                className="flex items-center gap-4 rounded-xl border border-border p-5 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div className="grid size-12 place-items-center rounded-lg bg-primary/10 font-serif text-lg font-bold text-primary">
                  C
                </div>
                <div>
                  <div className="font-semibold">MHT-CET</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    State Level — Maharashtra engineering colleges
                  </div>
                </div>
                <ArrowRight className="ml-auto size-4 text-muted-foreground" />
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

        {step === 'preferences' && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="size-4" />
              {exam === 'JEE' ? 'JEE Main' : 'MHT-CET'}
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
              Your Details
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Enter your score and preferences to find the best college matches.
            </p>

            <div className="mt-8 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Percentile <span className="text-destructive">*</span>
                <input
                  required
                  value={percentile}
                  onChange={(e) => setPercentile(e.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 92.50"
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Category <span className="text-destructive">*</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="OPEN">OPEN (General)</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="TFWS">TFWS (Tuition Fee Waiver)</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Preferred Branch
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>All Branches</option>
                  <option>Computer Science & Engineering</option>
                  <option>Electronics & Communication</option>
                  <option>Mechanical Engineering</option>
                  <option>Information Technology</option>
                  <option>Electrical Engineering</option>
                  <option>Civil Engineering</option>
                </select>
              </label>

              <button
                onClick={submit}
                disabled={loading || !percentile}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Find My Best Colleges'
                )}
                {!loading && <ArrowRight className="size-4" />}
              </button>
            </div>

            <button
              onClick={() => setStep('exam')}
              className="mt-6 flex items-center gap-1 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to exam selection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
