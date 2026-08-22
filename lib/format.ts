export function formatINR(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`
  return `₹${new Intl.NumberFormat('en-IN').format(value)}`
}

export function formatPackage(value: number) {
  return `${formatINR(Math.round(value * 100000))} / yr`
}

export function formatRating(value: number) {
  return value.toFixed(1)
}

export function formatROI(avgPackage: number, totalFees: number): string {
  if (totalFees === 0) return 'N/A'
  const roi = avgPackage / totalFees
  return roi.toFixed(1) + 'x'
}

export function parseFacilities(facilities: string): string[] {
  try {
    return JSON.parse(facilities || '[]')
  } catch {
    return []
  }
}

// same shape as facilities — any JSON string[] column (scholarships, recruiters)
export const parseList = parseFacilities
