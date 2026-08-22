'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { AuthButton } from '@/components/auth-button'
import { BellRing, ExternalLink, Loader2 } from 'lucide-react'

type Notice = {
  id: number
  branch: string
  vacancyCount: number
  applicationDeadline: string
  noticePdfUrl: string
  publishedAt: string
  college: { id: number; name: string; location: string }
}

const statuses = ['Applying', 'Submitted', 'Attended', 'Allotted'] as const

export default function SpotRoundsPage() {
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [mine, setMine] = useState<Record<number, string>>({})
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [branch, setBranch] = useState('')

  useEffect(() => {
    fetch(`/api/spot-notices${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`)
      .then((r) => r.json())
      .then((body) => setNotices(body.data))
      .catch(() => setNotices([]))
  }, [branch])

  useEffect(() => {
    fetch('/api/user/spot-applications')
      .then(async (r) => {
        if (r.status === 401) throw new Error('unauthorized')
        return r.json()
      })
      .then((body) => {
        setSignedIn(true)
        setMine(Object.fromEntries(body.data.map((a: { noticeId: number; status: string }) => [a.noticeId, a.status])))
      })
      .catch(() => setSignedIn(false))
  }, [])

  async function setStatus(noticeId: number, status: string) {
    setMine((cur) => ({ ...cur, [noticeId]: status }))
    const res = await fetch('/api/user/spot-applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ noticeId, status }),
    })
    if (!res.ok) setMine((cur) => {
      const next = { ...cur }
      delete next[noticeId]
      return next
    })
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-10 pb-28">
        <p className="eyebrow">Live vacancies</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Spot Round & Institute-Level Feed</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Vacant seats published after regular CAP rounds close. Deadlines are short — check back often.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Filter by branch, e.g. Computer"
            aria-label="Filter by branch"
            className="h-11 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>

        {signedIn === false && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <span>Sign in to mark which spot rounds you&apos;re applying to.</span>
            <AuthButton />
          </div>
        )}

        {notices === null ? (
          <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : notices.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
            <BellRing className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 font-semibold">No open spot-round notices</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Institutes publish vacancies here as soon as rounds close.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {notices.map((notice) => {
              const daysLeft = Math.ceil((new Date(notice.applicationDeadline).getTime() - Date.now()) / 86400000)
              return (
                <article key={notice.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/college/${notice.college.id}`} className="font-serif text-lg font-semibold hover:text-primary">
                      {notice.college.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{notice.college.location} · {notice.branch}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-2xl font-semibold text-primary">{notice.vacancyCount}</p>
                    <p className="text-xs text-muted-foreground">vacant seats</p>
                  </div>
                  <div className="w-32 text-right">
                    <p className={`text-sm font-semibold ${daysLeft <= 7 ? 'text-destructive' : ''}`}>
                      {daysLeft}d left
                    </p>
                    <p className="text-xs text-muted-foreground">
                      apply by {new Date(notice.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {notice.noticePdfUrl && (
                    <a
                      href={notice.noticePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary"
                    >
                      Notice PDF <ExternalLink className="size-3" />
                    </a>
                  )}
                  {signedIn && (
                    <select
                      value={mine[notice.id] ?? ''}
                      onChange={(e) => setStatus(notice.id, e.target.value)}
                      aria-label={`Application status for ${notice.college.name} ${notice.branch}`}
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option value="" disabled>Track…</option>
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </AppShell>
  )
}
