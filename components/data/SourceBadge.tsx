import { BadgeCheck, TriangleAlert } from 'lucide-react'

type Props = {
  sourceName?: string | null
  sourceUrl?: string | null
  sourceDate?: string | Date | null
  verifiedAt?: string | Date | null
}

function formatDate(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function SourceBadge({ sourceName, sourceUrl, sourceDate, verifiedAt }: Props) {
  const date = formatDate(sourceDate)
  const verified = Boolean(verifiedAt && sourceUrl)
  const label = verified
    ? `Verified${date ? ` ${date}` : ''} · ${sourceName || 'Official source'}`
    : `Unverified${sourceName ? ` · ${sourceName}` : ''}`

  const content = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        verified
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
      title={verified ? sourceUrl ?? undefined : 'This row has not been verified against an official source.'}
    >
      {verified ? <BadgeCheck className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
      {label}
    </span>
  )

  if (verified && sourceUrl) {
    return (
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
        {content}
      </a>
    )
  }
  return content
}
