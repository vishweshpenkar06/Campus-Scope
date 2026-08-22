import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

const createSchema = z.object({
  collegeId: z.coerce.number().int().positive(),
  targetBranch: z.string().trim().min(1).max(120),
  category: z.enum(['OPEN', 'OBC', 'SC', 'ST', 'TFWS']).default('OPEN'),
  priority: z.coerce.number().int().min(0).max(100).default(0),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to view your shortlist', 401)

  const items = await prisma.savedCollege.findMany({
    where: { userId: session.user.id },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    include: {
      college: {
        select: {
          id: true, name: true, location: true, fees: true, rating: true,
          hostelAvailable: true, hostelFees: true,
          placements: { orderBy: { year: 'desc' }, take: 1, select: { avgPackage: true } },
        },
      },
    },
  })
  return Response.json({ data: items })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to save colleges', 401)

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid shortlist entry', 400, parsed.error.flatten())

  try {
    const item = await prisma.savedCollege.upsert({
      where: { userId_collegeId: { userId: session.user.id, collegeId: parsed.data.collegeId } },
      create: { ...parsed.data, userId: session.user.id },
      update: {
        targetBranch: parsed.data.targetBranch,
        category: parsed.data.category,
        priority: parsed.data.priority,
      },
      include: { college: { select: { id: true, name: true } } },
    })
    return Response.json({ data: item }, { status: 201 })
  } catch {
    return errorResponse('Could not save that college', 500)
  }
}
