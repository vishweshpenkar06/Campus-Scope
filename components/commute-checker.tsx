'use client'

import { useState } from 'react'
import { Bus, Car, Loader2, MapPin, TrainFront } from 'lucide-react'
import type { DistanceEstimate } from '@/lib/types'

export function CommuteChecker({ collegeName, location }: { collegeName: string; location: string }) {
  const [origin, setOrigin] = useState('')
  const [estimate, setEstimate] = useState<DistanceEstimate | null>(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!origin.trim()) return
    setLoading(true)
    setNotice('')
    setEstimate(null)
    try {
      const res = await fetch(
        `/api/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(`${collegeName}, ${location}`)}`
      )
      const body = await res.json()
      if (body.data) setEstimate(body.data)
      else if (body.source === 'no-api-key') setNotice('Travel estimates need a Google Maps API key on the server.')
      else setNotice('Could not find a route. Try your nearest railway station or bus hub.')
    } catch {
      setNotice('Travel estimates are unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-primary" />
        <h3 className="font-serif text-xl font-semibold">Commute Checker</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your home area or nearest railway / bus hub to estimate travel to campus.
      </p>

      <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="e.g. Thane Station"
          className="h-11 min-w-56 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Estimate'}
        </button>
      </form>

      {estimate && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {estimate.transitText && (
            <div className="rounded-lg border border-border px-3 py-2 text-sm">
              <TrainFront className="mb-1 size-4 text-primary" />
              <p className="font-semibold">{estimate.transitText}</p>
              <p className="text-xs text-muted-foreground">Public transport</p>
            </div>
          )}
          {estimate.drivingText && (
            <div className="rounded-lg border border-border px-3 py-2 text-sm">
              <Car className="mb-1 size-4 text-primary" />
              <p className="font-semibold">{estimate.drivingText}</p>
              <p className="text-xs text-muted-foreground">By road</p>
            </div>
          )}
          {estimate.distanceText && (
            <div className="rounded-lg border border-border px-3 py-2 text-sm">
              <Bus className="mb-1 size-4 text-primary" />
              <p className="font-semibold">{estimate.distanceText}</p>
              <p className="text-xs text-muted-foreground">Approx. distance</p>
            </div>
          )}
        </div>
      )}
      {notice && <p className="mt-3 text-sm text-muted-foreground">{notice}</p>}
    </div>
  )
}
