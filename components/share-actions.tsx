'use client'

import { Download, MessageCircle } from 'lucide-react'
import { formatINR, formatPackage } from '@/lib/format'
import type { CollegeDetail as Detail } from '@/lib/types'

export function ShareActions({ college }: { college: Detail }) {
  const latest = college.placements[0]
  const summary = [
    `🎓 ${college.name}, ${college.location}`,
    college.fees > 0 ? `💰 Fees: ${formatINR(college.fees)}/yr` : null,
    latest && latest.avgPackage > 0 ? `📦 Avg package: ${formatPackage(latest.avgPackage)}` : null,
    college.rating > 0 ? `⭐ Rating: ${college.rating.toFixed(1)}/5` : null,
    `View full profile: ${typeof window !== 'undefined' ? window.location.href : ''}`,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(summary)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
      >
        <MessageCircle className="size-4" />
        Share via WhatsApp
      </a>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
      >
        <Download className="size-4" />
        Download PDF Summary
      </button>
    </div>
  )
}
