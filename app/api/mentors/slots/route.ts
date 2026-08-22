import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

const querySchema = z.object({ collegeId: z.coerce.number().int().positive() })

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({ collegeId: new URL(request.url).searchParams.get('collegeId') })
  if (!parsed.success) return errorResponse('Provide a college id', 400)

  const data = await prisma.mentorSlot.findMany({
    where: { collegeId: parsed.data.collegeId, status: 'Open', startTime: { gt: new Date() } },
    orderBy: { startTime: 'asc' },
    take: 20,
    include: { mentor: { select: { name: true, image: true } } },
  })
  return Response.json({
    data: data.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      durationMin: s.durationMin,
      mentorName: s.mentor.name ?? 'Verified senior',
      mentorImage: s.mentor.image,
    })),
  })
}

const createSchema = z.object({
  collegeId: z.coerce.number().int().positive(),
  startTime: z.coerce.date(),
  durationMin: z.union([z.literal(15), z.literal(30)]).default(15),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to offer mentoring slots', 401)

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid slot details', 400, parsed.error.flatten())
  if (parsed.data.startTime.getTime() < Date.now()) return errorResponse('Slot must be in the future', 400)

  try {
    const data = await prisma.mentorSlot.create({
      data: {
        mentorId: session.user.id,
        collegeId: parsed.data.collegeId,
        startTime: parsed.data.startTime,
        durationMin: parsed.data.durationMin,
      },
    })
    // ponytail: any signed-in user can host slots — a real mentor verification flow is deferred
    return Response.json({ data }, { status: 201 })
  } catch {
    return errorResponse('Could not create that slot', 500)
  }
}
