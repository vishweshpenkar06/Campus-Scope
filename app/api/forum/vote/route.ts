import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

const voteSchema = z.object({ postId: z.coerce.number().int().positive() })

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to upvote', 401)
  const userId = session.user.id

  const parsed = voteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid vote target', 400, parsed.error.flatten())

  try {
    // toggle in one transaction: existing vote → retract; otherwise cast
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.forumVote.findUnique({
        where: { userId_postId: { userId, postId: parsed.data.postId } },
      })
      if (existing) {
        await tx.forumVote.delete({ where: { id: existing.id } })
        const post = await tx.forumPost.update({
          where: { id: parsed.data.postId },
          data: { upvotes: { decrement: 1 } },
          select: { upvotes: true },
        })
        return { upvotes: post.upvotes, voted: false }
      }
      await tx.forumVote.create({ data: { userId, postId: parsed.data.postId } })
      const post = await tx.forumPost.update({
        where: { id: parsed.data.postId },
        data: { upvotes: { increment: 1 } },
        select: { upvotes: true },
      })
      return { upvotes: post.upvotes, voted: true }
    })
    return Response.json({ data: result })
  } catch {
    return errorResponse('Could not register that vote', 400)
  }
}
