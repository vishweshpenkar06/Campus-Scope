import { BadgeCheck, ExternalLink, TriangleAlert } from 'lucide-react'
import type { Citation } from '@/lib/data/provenance'

export function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      {citation.verified ? (
        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      ) : (
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
      )}
      <div className="min-w-0 text-xs leading-5">
        <p className="truncate font-semibold">{citation.source}</p>
        <p className="text-muted-foreground">
          {citation.date ? `Source date ${citation.date} · ` : ''}
          {citation.verified ? 'verified' : 'unverified'} · confidence{' '}
          {Math.round(citation.confidence * 100)}%
        </p>
        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Open source <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  )
}
