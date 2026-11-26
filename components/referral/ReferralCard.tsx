'use client'

import { useEffect, useState } from 'react'
import { Copy, Gift } from 'lucide-react'
import { recordReferral } from '@/lib/referral'

export function ReferralCard() {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage referral code is only available after mount */
    setCode(recordReferral().code)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const link =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/?ref=${code || 'campusscope'}`

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Gift className="size-4 text-primary" />
        <h2 className="font-serif text-xl font-semibold">Bring a friend</h2>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Share a link with your college group. We track referrals in aggregate, never as personal data.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-muted px-3 py-2 text-sm font-semibold">{code || '…'}</code>
        <button
          disabled={!code}
          onClick={async () => {
            await navigator.clipboard.writeText(link)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
        >
          <Copy className="size-4" /> {copied ? 'Copied' : 'Copy invite link'}
        </button>
      </div>
    </section>
  )
}
