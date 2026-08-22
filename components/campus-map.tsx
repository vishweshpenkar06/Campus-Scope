'use client'

import { useEffect, useState } from 'react'
import { Bus, Loader2, MapPin, TrainFront } from 'lucide-react'

type Landmark = { label: string; name: string; address: string | null }

const labelIcons: Record<string, React.ReactNode> = {
  'Railway station': <TrainFront className="size-4 text-primary" />,
  'PG / hostel hub': <MapPin className="size-4 text-primary" />,
  'Mess / tiffin': <Bus className="size-4 text-primary" />,
}

export function CampusMap({ collegeName, location }: { collegeName: string; location: string }) {
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null)
  const query = `${collegeName}, ${location}`

  useEffect(() => {
    fetch(`/api/places/nearby?location=${encodeURIComponent(location)}`)
      .then((r) => r.json())
      .then((body) => setLandmarks(body.data ?? []))
      .catch(() => setLandmarks([]))
  }, [location])

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Pan around the campus and its neighbourhood — stations, PGs, and food spots students rely on.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <iframe
          title={`Map of ${collegeName}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
          className="h-80 w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {landmarks === null ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Finding nearby landmarks…
        </div>
      ) : landmarks.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(['Railway station', 'PG / hostel hub', 'Mess / tiffin'] as const).map((label) => {
            const hits = landmarks.filter((l) => l.label === label).slice(0, 2)
            if (!hits.length) return null
            return (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                  {labelIcons[label]} {label}
                </p>
                <ul className="mt-2 grid gap-1.5 text-sm">
                  {hits.map((hit) => (
                    <li key={`${label}-${hit.name}`}>
                      <span className="font-medium">{hit.name}</span>
                      {hit.address && <span className="block truncate text-xs text-muted-foreground">{hit.address}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Landmark data needs a Google Places key on the server — the map above still works.
        </p>
      )}
    </div>
  )
}
