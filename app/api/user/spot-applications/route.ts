import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

const upsertSchema = z.object({
  noticeId: z.coerce.number().int().positive(),
  status: z.enum(['Applying', 'Submitted', 'Attended', 'Allotted']),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in required', 401)

  const data = await prisma.spotApplication.findMany({ where: { userId: session.user.id } })
  return Response.json({ data })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to track spot applications', 401)

  const parsed = upsertSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid application update', 400, parsed.error.flatten())

  const status = parsed.data.status
  try {
    const data = await prisma.spotApplication.upsert({
      where: { userId_noticeId: { userId: session.user.id, noticeId: parsed.data.noticeId } },
      create: {
        userId: session.user.id,
        noticeId: parsed.data.noticeId,
        status,
        submittedAt: status === 'Applying' ? null : new Date(),
      },
      update: {
        status,
        submittedAt: status === 'Applying' ? null : new Date(),
      },
    })
    return Response.json({ data })
  } catch {
    return errorResponse('Notice not found', 404)
  }
}
