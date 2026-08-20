'use client'

import { useState } from 'react'
import { GraduationCap, Stethoscope, ArrowRight, X } from 'lucide-react'
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

export function OnboardingModal({ onComplete }: { onComplete: (state: OnboardingState) => void }) {
  const [step, setStep] = useState<'stream' | 'exam'>('stream')
  const [stream, setStream] = useState<OnboardingState['stream']>(null)
  const [exam, setExam] = useState<OnboardingState['exam']>(null)

  function selectStream(s: OnboardingState['stream']) {
    setStream(s)
    if (s === 'medical') return
    setStep('exam')
  }

  function selectExam(e: OnboardingState['exam']) {
    setExam(e)
    const state: OnboardingState = { stream: 'engineering', exam: e }
    saveOnboardingState(state)
    onComplete(state)
  }

  function skip() {
    const state: OnboardingState = { stream: 'engineering', exam: null }
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

        {step === 'stream' ? (
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
        ) : (
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
              className="mt-6 text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to stream selection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
