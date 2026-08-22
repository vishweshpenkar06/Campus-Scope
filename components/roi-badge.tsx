import { TrendingUp } from 'lucide-react'
import { formatROI } from '@/lib/format'

// ROI = avg placement package / (4-yr tuition + hostel)
export function RoiBadge({
  avgPackageInr,
  fees,
  hostelFees = 0,
  compact = false,
}: {
  avgPackageInr?: number
  fees: number
  hostelFees?: number
  compact?: boolean
}) {
  if (!avgPackageInr) return null
  const totalCost = fees * 4 + hostelFees * 4
  const roi = formatROI(avgPackageInr, totalCost)
  if (roi === 'N/A') return null

  return (
    <span
      title="Average package ÷ 4-year tuition + hostel cost"
      className={`inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 font-semibold text-green-700 ${
        compact ? 'text-[10px]' : 'text-sm'
      }`}
    >
      <TrendingUp className={compact ? 'size-3' : 'size-4'} />
      {roi} {compact ? 'ROI' : '4-Yr ROI'}
    </span>
  )
}
