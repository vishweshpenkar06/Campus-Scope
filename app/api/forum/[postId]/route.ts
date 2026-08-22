import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

export async function GET(_: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const id = Number(postId)
  if (!Number.isInteger(id)) return errorResponse('Invalid post id', 400)

  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, image: true } },
      comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { name: true, image: true } } } },
    },
  })
  if (!post) return errorResponse('Question not found', 404)

  const seniors = await prisma.mentorSlot.findMany({ where: { collegeId: post.collegeId }, select: { mentorId: true } })
  const seniorIds = new Set(seniors.map((s) => s.mentorId))

  return Response.json({
    data: {
      id: post.id,
      title: post.title,
      content: post.content,
      upvotes: post.upvotes,
      authorName: post.author.name ?? 'Candidate',
      senior: seniorIds.has(post.userId),
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        authorName: c.author.name ?? 'Candidate',
        senior: seniorIds.has(c.userId),
      })),
    },
  })
}

const commentSchema = z.object({ content: z.string().trim().min(3).max(1000) })

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to reply', 401)

  const { postId } = await params
  const id = Number(postId)
  if (!Number.isInteger(id)) return errorResponse('Invalid post id', 400)

  const parsed = commentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid reply', 400, parsed.error.flatten())

  try {
    const data = await prisma.forumComment.create({
      data: { postId: id, userId: session.user.id, content: parsed.data.content },
      include: { author: { select: { name: true } } },
    })
    return Response.json(
      { data: { id: data.id, content: data.content, createdAt: data.createdAt, authorName: data.author.name ?? 'Candidate', senior: false } },
      { status: 201 }
    )
  } catch {
    return errorResponse('Could not post that reply', 500)
  }
}
