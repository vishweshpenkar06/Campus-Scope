import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/validation'

// "Verified senior" = the author hosts mentoring slots at this college — a signal tied to real features.
async function verifiedSeniorIds(collegeId: number): Promise<Set<string>> {
  const slots = await prisma.mentorSlot.findMany({ where: { collegeId }, select: { mentorId: true } })
  return new Set(slots.map((s) => s.mentorId))
}

const querySchema = z.object({
  collegeId: z.coerce.number().int().positive(),
  sort: z.enum(['new', 'top']).default('new'),
})

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const parsed = querySchema.safeParse({ collegeId: params.get('collegeId'), sort: params.get('sort') ?? undefined })
  if (!parsed.success) return errorResponse('Provide a college id', 400)

  const session = await auth()
  const [posts, seniors] = await Promise.all([
    prisma.forumPost.findMany({
      where: { collegeId: parsed.data.collegeId },
      orderBy: parsed.data.sort === 'top' ? [{ upvotes: 'desc' }, { createdAt: 'desc' }] : { createdAt: 'desc' },
      take: 30,
      include: {
        author: { select: { name: true, image: true } },
        _count: { select: { comments: true } },
      },
    }),
    verifiedSeniorIds(parsed.data.collegeId),
  ])
  const myVotes = session?.user?.id
    ? await prisma.forumVote.findMany({ where: { userId: session.user.id, postId: { in: posts.map((p) => p.id) } }, select: { postId: true } })
    : []
  const votedIds = new Set(myVotes.map((v) => v.postId))

  return Response.json({
    data: posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      upvotes: p.upvotes,
      createdAt: p.createdAt,
      authorName: p.author.name ?? 'Candidate',
      authorImage: p.author.image,
      senior: seniors.has(p.userId),
      commentCount: p._count.comments,
      votedByMe: votedIds.has(p.id),
    })),
  })
}

const createSchema = z.object({
  collegeId: z.coerce.number().int().positive(),
  title: z.string().trim().min(8).max(150),
  content: z.string().trim().min(10).max(2000),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Sign in to post a question', 401)

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse('Invalid question', 400, parsed.error.flatten())

  try {
    const data = await prisma.forumPost.create({
      data: { ...parsed.data, userId: session.user.id },
    })
    return Response.json({ data }, { status: 201 })
  } catch {
    return errorResponse('Could not post that question', 500)
  }
}
