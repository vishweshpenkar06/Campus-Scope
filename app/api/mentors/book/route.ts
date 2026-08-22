import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

const bookSchema = z.object({ slotId: z.coerce.number().int().positive() })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in required', 401)

  const data = await prisma.booking.findMany({
    where: { candidateId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      slot: {
        select: { startTime: true, durationMin: true, status: true, college: { select: { id: true, name: true } }, mentor: { select: { name: true } } },
      },
    },
  })
  return Response.json({ data })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to book a slot', 401)

  const parsed = bookSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid slot', 400, parsed.error.flatten())

  // atomic claim: the conditional update wins for exactly one concurrent candidate
  const claimed = await prisma.mentorSlot.updateMany({
    where: { id: parsed.data.slotId, status: 'Open', startTime: { gt: new Date() } },
    data: { status: 'Booked' },
  })
  if (claimed.count === 0) return errorResponse('That slot was just taken or is no longer available', 409)

  try {
    const booking = await prisma.booking.create({
      data: { slotId: parsed.data.slotId, candidateId: session.user.id },
      include: {
        slot: {
          select: { startTime: true, durationMin: true, college: { select: { name: true } }, mentor: { select: { name: true } } },
        },
      },
    })

    const slot = await prisma.mentorSlot.findUnique({
      where: { id: parsed.data.slotId },
      select: { mentorId: true, college: { select: { name: true } } },
    })
    if (slot) {
      await prisma.notification
        .create({
          data: {
            userId: slot.mentorId,
            title: 'Slot booked',
            message: `A candidate booked your ${slot.college.name} guidance call.`,
            type: 'booking',
            dedupeKey: `booking:${booking.id}`,
          },
        })
        .catch(() => {})
    }

    return Response.json({ data: booking }, { status: 201 })
  } catch {
    // compensate the claim so the slot returns to the pool
    await prisma.mentorSlot.updateMany({ where: { id: parsed.data.slotId, status: 'Booked' }, data: { status: 'Open' } }).catch(() => {})
    return errorResponse('Could not complete that booking', 500)
  }
}
