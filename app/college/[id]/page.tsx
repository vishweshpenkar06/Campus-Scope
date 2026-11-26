import { AppShell } from '@/components/app-shell'
import { CollegeDetail } from '@/components/college-detail'
import { prisma } from '@/lib/prisma'
import { collegeIdSchema } from '@/lib/validation'
import type { CollegeDetail as Detail } from '@/lib/types'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let initialCollege: Detail | null = null

  const parsed = collegeIdSchema.safeParse(id)
  if (parsed.success) {
    try {
      const college = await prisma.college.findUnique({
        where: { id: parsed.data },
        include: {
          courses: { orderBy: { name: 'asc' } },
          placements: { orderBy: { year: 'desc' } },
          reviews: { orderBy: { createdAt: 'desc' } },
          cutoffs: { orderBy: { percentile: 'desc' } },
          capRoundTrends: { orderBy: [{ year: 'desc' }, { branch: 'asc' }] },
          seatMatrices: { orderBy: { branch: 'asc' } },
          campusInsights: { orderBy: { createdAt: 'desc' } },
        },
      })
      if (college) initialCollege = JSON.parse(JSON.stringify(college)) as Detail
    } catch {
      // The client falls back to the API (or an honest error in production).
    }
  }

  return (
    <AppShell>
      <CollegeDetail key={id} id={id} initialCollege={initialCollege} />
    </AppShell>
  )
}
