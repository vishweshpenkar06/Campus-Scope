import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const schema = z.object({ status: z.enum(['new', 'reviewing', 'resolved', 'rejected']) })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Invalid id' }, { status: 400 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid status' }, { status: 400 })
  try {
    const data = await prisma.correctionRequest.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    })
    return Response.json({ data })
  } catch {
    return Response.json({ error: 'Correction not found' }, { status: 404 })
  }
}
