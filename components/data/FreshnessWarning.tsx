import { Clock } from 'lucide-react'
import { freshnessDays, STALE_AFTER_DAYS } from '@/lib/data/provenance'

export function FreshnessWarning({ sourceDate }: { sourceDate?: string | Date | null }) {
  const date = sourceDate ? (sourceDate instanceof Date ? sourceDate : new Date(sourceDate)) : null
  const days = date && !Number.isNaN(date.getTime()) ? freshnessDays({ sourceDate: date }) : null
  if (days !== null && days <= STALE_AFTER_DAYS) return null

  return (
    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
      <Clock className="mt-0.5 size-3.5 shrink-0" />
      {days === null
        ? 'No source date recorded. Treat these numbers as unverified.'
        : `Source data is ${days} days old (limit ${STALE_AFTER_DAYS}). Check the official portal before relying on it.`}
    </p>
  )
}
