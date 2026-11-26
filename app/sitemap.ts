import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { demoColleges } from '@/lib/demo-data'
import { SITE_URL, collegeSlug } from '@/lib/seo'
import { BRANCHES } from '@/lib/branches'
import { GUIDES } from '@/lib/content/guides'

const STATIC_PATHS = [
  '',
  '/explore',
  '/predictor',
  '/simulator',
  '/compare',
  '/documents',
  '/option-form',
  '/spot-rounds',
  '/shortlist',
  '/counsellors',
  '/alerts',
  '/methodology',
  '/about',
  '/privacy',
  '/terms',
]

const CATEGORIES = ['OPEN', 'OBC', 'SC', 'ST']

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let colleges: Array<{ id: number; name: string }> = []
  try {
    if (!process.env.DATABASE_URL) throw new Error('no database configured')
    colleges = await prisma.college.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    })
  } catch {
    colleges = demoColleges.map((college) => ({ id: college.id, name: college.name }))
  }
  if (!colleges.length) {
    colleges = demoColleges.map((college) => ({ id: college.id, name: college.name }))
  }

  const now = new Date()
  return [
    ...GUIDES.map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: new Date(guide.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...colleges.flatMap((college) => {
      const base = `${SITE_URL}/colleges/${collegeSlug(college.id, college.name)}`
      return [
        {
          url: base,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
        ...BRANCHES.flatMap((branch) => [
          {
            url: `${base}?branch=${encodeURIComponent(branch)}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.5,
          },
          ...CATEGORIES.map((category) => ({
            url: `${base}?branch=${encodeURIComponent(branch)}&category=${category}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.4,
          })),
        ]),
      ]
    }),
  ]
}
