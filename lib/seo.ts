export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://campusscope.vercel.app'

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function collegeSlug(id: number, name: string): string {
  return `${id}-${slugify(name)}`
}

export function parseCollegeSlug(slug: string): number | null {
  const id = Number(slug.split('-')[0])
  return Number.isInteger(id) && id > 0 ? id : null
}

export function collegeJsonLd(college: {
  name: string
  location: string
  overview: string
  websiteUrl?: string | null
  fees: number
  rating: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: college.name,
    description: college.overview,
    address: {
      '@type': 'PostalAddress',
      addressLocality: college.location,
      addressCountry: 'IN',
    },
    url: college.websiteUrl || undefined,
  }
}
