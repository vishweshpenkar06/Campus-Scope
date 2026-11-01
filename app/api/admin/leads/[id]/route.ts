import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const schema = z.object({
  status: z.enum(['new', 'contacted', 'converted', 'lost']),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const id = (await params).id
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid status' }, { status: 400 })

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    })
    return Response.json({ data: lead })
  } catch {
    return Response.json({ error: 'Lead not found' }, { status: 404 })
  }
}
