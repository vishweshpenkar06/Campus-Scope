'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, CheckCircle2, Clock } from 'lucide-react'
import { AuthButton } from './auth-button'

type Slot = { id: number; startTime: string; durationMin: number; mentorName: string; mentorImage?: string | null }

export function MentorSlots({ collegeId }: { collegeId: number }) {
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [bookedId, setBookedId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/mentors/slots?collegeId=${collegeId}`)
      .then((r) => r.json())
      .then((body) => setSlots(body.data))
      .catch(() => setSlots([]))
    fetch('/api/user/notifications')
      .then((r) => setSignedIn(r.status !== 401))
      .catch(() => setSignedIn(false))
  }, [collegeId])

  const byDay = useMemo(() => {
    const groups = new Map<string, Slot[]>()
    for (const slot of slots ?? []) {
      const day = new Date(slot.startTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      groups.set(day, [...(groups.get(day) ?? []), slot])
    }
    return [...groups.entries()]
  }, [slots])

  async function book(slot: Slot) {
    setError('')
    const res = await fetch('/api/mentors/book', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slotId: slot.id }),
    })
    if (res.status === 401) return setSignedIn(false)
    if (res.status === 409) {
      setError('That slot was just taken — pick another.')
      setSlots((cur) => cur?.filter((s) => s.id !== slot.id) ?? cur)
      return
    }
    if (!res.ok) return setError('Booking failed. Try again.')
    setBookedId(slot.id)
    setSlots((cur) => cur?.filter((s) => s.id !== slot.id) ?? cur)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <CalendarCheck className="size-4 text-primary" />
        <h3 className="font-serif text-xl font-semibold">Book a 1-on-1 Guidance Call</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        15-minute calls with verified seniors and alumni of this college.
      </p>

      {bookedId !== null && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">
          <CheckCircle2 className="mr-1 inline size-4" /> Booked! The mentor has been notified — check your notifications for details.
        </div>
      )}
      {signedIn === false && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4">
          <span className="text-sm">Sign in to book a call.</span>
          <AuthButton />
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}

      {slots === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading slots…</p>
      ) : slots.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No open slots right now.{' '}
          <Link href="/explore" className="text-primary underline-offset-4 hover:underline">
            Browse other colleges
          </Link>{' '}
          meanwhile.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {byDay.map(([day, daySlots]) => (
            <div key={day}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{day}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {daySlots.map((slot) => {
                  const time = new Date(slot.startTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
                  return (
                    <button
                      key={slot.id}
                      onClick={() => book(slot)}
                      disabled={signedIn === false}
                      title={`${slot.durationMin} min with ${slot.mentorName}`}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        signedIn ? 'border-border hover:border-primary hover:text-primary' : 'border-border opacity-60'
                      }`}
                    >
                      <Clock className="size-3" />
                      {time} · {slot.mentorName.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
