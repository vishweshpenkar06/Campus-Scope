import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

const patchSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).max(100).optional(),
  all: z.boolean().optional(),
})

// Deadline reminders are synthesized at read time (≤24h out) and deduped — no cron needed for them.
async function synthesizeDeadlineReminders(userId: string) {
  const soon = await prisma.admissionDeadline.findMany({
    where: { eventDate: { gte: new Date(), lte: new Date(Date.now() + 86400000) } },
  })
  for (const deadline of soon) {
    await prisma.notification
      .create({
        data: {
          userId,
          title: `Deadline tomorrow: ${deadline.title}`,
          message: `${deadline.description} Due ${deadline.eventDate.toLocaleString('en-IN')}.`,
          type: 'deadline',
          dedupeKey: `deadline:${deadline.id}`,
        },
      })
      .catch(() => {}) // duplicate → already reminded
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in required', 401)

  await synthesizeDeadlineReminders(session.user.id)
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
  ])
  return Response.json({ data: items, unreadCount })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in required', 401)

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || (!parsed.data.all && !parsed.data.ids?.length)) {
    return errorResponse('Nothing to mark read', 400)
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      read: false,
      ...(parsed.data.all ? {} : { id: { in: parsed.data.ids } }),
    },
    data: { read: true },
  })
  return Response.json({ data: { updated: result.count } })
}
