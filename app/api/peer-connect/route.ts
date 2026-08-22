import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

const createSchema = z.object({
  collegeId: z.coerce.number().int().positive(),
  targetBranch: z.string().trim().min(1).max(120),
  notes: z.string().trim().min(3).max(500),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in required', 401)

  const data = await prisma.peerConnectRequest.findMany({
    where: { studentId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { college: { select: { name: true, location: true } } },
  })
  return Response.json({ data })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to connect with seniors', 401)

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid request', 400, parsed.error.flatten())

  try {
    const data = await prisma.peerConnectRequest.create({
      data: {
        studentId: session.user.id,
        collegeId: parsed.data.collegeId,
        targetBranch: parsed.data.targetBranch,
        notes: parsed.data.notes,
      },
    })
    return Response.json({ data }, { status: 201 })
  } catch {
    return errorResponse('Could not send that request', 400)
  }
}
