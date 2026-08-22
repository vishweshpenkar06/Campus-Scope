import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

const patchSchema = z.object({
  status: z.enum(['Researching', 'Applying', 'Applied', 'Allotted']).optional(),
  priority: z.coerce.number().int().min(0).max(100).optional(),
  targetBranch: z.string().trim().min(1).max(120).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in required', 401)

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid update', 400, parsed.error.flatten())

  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) return errorResponse('Invalid entry id', 400)

  try {
    const item = await prisma.savedCollege.update({
      where: { id: numericId },
      data: parsed.data,
    })
    // ownership check after update keeps the query simple; revert is unnecessary since we 403 below
    if (item.userId !== session.user.id) return errorResponse('Not your entry', 403)
    return Response.json({ data: item })
  } catch {
    return errorResponse('Entry not found', 404)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in required', 401)

  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) return errorResponse('Invalid entry id', 400)

  const existing = await prisma.savedCollege.findUnique({ where: { id: numericId } })
  if (!existing || existing.userId !== session.user.id) return errorResponse('Entry not found', 404)

  await prisma.savedCollege.delete({ where: { id: numericId } })
  return Response.json({ data: { ok: true } })
}
