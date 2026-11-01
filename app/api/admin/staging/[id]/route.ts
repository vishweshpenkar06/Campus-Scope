import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { applyStagingRecord, rejectStagingRecord } from '@/lib/data/staging'

export const dynamic = 'force-dynamic'

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(500).optional(),
  edits: z.record(z.string(), z.unknown()).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Invalid record' }, { status: 400 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid action' }, { status: 400 })

  try {
    if (parsed.data.action === 'reject') {
      await rejectStagingRecord(prisma, id, parsed.data.reason ?? 'Rejected by reviewer')
      return Response.json({ data: { id, status: 'rejected' } })
    }
    const result = await applyStagingRecord(prisma, id, admin.email, parsed.data.edits)
    return Response.json({ data: { id, status: 'approved', ...result } })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Review action failed' },
      { status: 400 }
    )
  }
}
