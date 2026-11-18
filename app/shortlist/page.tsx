'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { AuthButton } from '@/components/auth-button'
import { formatINR, formatPackage, formatRating } from '@/lib/format'
import { BookmarkCheck, Loader2, Trash2 } from 'lucide-react'

type SavedItem = {
  id: number
  targetBranch: string
  category: string
  priority: number
  status: string
  college: {
    id: number
    name: string
    location: string
    fees: number
    rating: number
    hostelAvailable: boolean
    hostelFees: number
    placements?: { avgPackage: number }[]
  }
}

const statuses = ['Researching', 'Applying', 'Applied', 'Allotted'] as const

export default function ShortlistPage() {
  const [items, setItems] = useState<SavedItem[] | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetch('/api/user/shortlist')
      .then(async (r) => {
        if (r.status === 401) throw new Error('unauthorized')
        if (!r.ok) throw new Error('load-failed')
        return r.json()
      })
      .then((body) => setItems(body.data))
      .catch((e) => {
        if (e.message === 'unauthorized') setUnauthorized(true)
        else setError('Could not load your shortlist.')
      })
  }, [])

  useEffect(load, [load])

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/user/shortlist/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setItems((cur) => cur?.map((i) => (i.id === id ? { ...i, status } : i)) ?? cur)
  }

  async function remove(id: number) {
    const res = await fetch(`/api/user/shortlist/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((cur) => cur?.filter((i) => i.id !== id) ?? cur)
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-10 pb-28">
        <p className="eyebrow">Candidate portal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">My Shortlist</h1>

        {unauthorized ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
            <p className="font-semibold">Sign in to build your shortlist</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Save target colleges, track branches and application status in one place.
            </p>
            <div className="mt-5 flex justify-center"><AuthButton /></div>
          </div>
        ) : error ? (
          <p role="alert" className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm">{error}</p>
        ) : items === null ? (
          <div className="mt-10 flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
            <BookmarkCheck className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 font-semibold">No saved colleges yet</p>
            <Link href="/explore" className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
              Browse the directory →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {items.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/college/${item.college.id}`} className="font-serif text-lg font-semibold hover:text-primary">
                    {item.college.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.college.location} · {item.targetBranch} · {item.category}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.college.fees > 0 ? `${formatINR(item.college.fees)}/yr` : 'Fees not verified'}
                    {item.college.rating > 0 && <> · ★ {formatRating(item.college.rating)}</>}
                    {item.college.placements?.[0] && item.college.placements[0].avgPackage > 0
                      ? ` · avg ${formatPackage(item.college.placements[0].avgPackage)}`
                      : ''}
                  </p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  aria-label={`Application status for ${item.college.name}`}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.college.name}`}
                  className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  )
}
