'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { AppShell } from '@/components/app-shell'
import { Loader2, Mail } from 'lucide-react'

type ProviderMap = Record<string, unknown>

export default function SignInPage() {
  const [providers, setProviders] = useState<ProviderMap | null>(null)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/providers')
      .then((response) => response.json())
      .then((body) => setProviders(body ?? {}))
      .catch(() => setProviders({}))
  }, [])

  const google = Boolean(providers?.google)
  const resend = Boolean(providers?.resend || providers?.email)

  return (
    <AppShell>
      <main className="mx-auto max-w-md px-5 py-16 pb-28">
        <p className="eyebrow">Candidate account</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">Save your shortlist.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sign in to save colleges, track applications, and keep your shortlist across devices.
          CampusScope never posts on your behalf.
        </p>

        {providers === null ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking sign-in options…
          </div>
        ) : !google && !resend ? (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Sign-in is not configured in this preview. The predictor, directory, and Ask work without
            an account.
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {google && (
              <button
                onClick={() => signIn('google', { callbackUrl: '/shortlist' })}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold transition hover:border-primary hover:text-primary"
              >
                Continue with Google
              </button>
            )}

            {resend && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">Email me a sign-in link</p>
                {state === 'sent' ? (
                  <p className="mt-2 text-sm text-emerald-700">
                    Check your inbox. The link expires in 24 hours.
                  </p>
                ) : (
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault()
                      setState('sending')
                      setError('')
                      const result = await signIn('resend', {
                        email,
                        callbackUrl: '/shortlist',
                        redirect: false,
                      })
                      if (result?.error) {
                        setError('Could not send the link. Try again.')
                        setState('idle')
                      } else {
                        setState('sent')
                      }
                    }}
                    className="mt-3 grid gap-2"
                  >
                    <label className="grid gap-1 text-xs font-semibold">
                      Email address
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </label>
                    {error && <p className="text-xs text-red-700">{error}</p>}
                    <button
                      disabled={state === 'sending'}
                      className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {state === 'sending' ? 'Sending…' : 'Email me a link'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-[11px] leading-5 text-muted-foreground">
          By signing in you agree to the beta terms and privacy notice. Do not share OTPs or payment
          credentials with anyone.
        </p>
      </main>
    </AppShell>
  )
}
