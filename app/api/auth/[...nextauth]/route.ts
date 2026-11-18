import { handlers } from '@/lib/auth'

// Preview/no-database mode: Auth.js with the Prisma adapter throws on session
// lookups when DATABASE_URL is absent. Return the empty shapes the client
// already understands instead of flooding the console with 500s.
async function previewAuth(request: Request) {
  const path = new URL(request.url).pathname
  if (path.endsWith('/providers')) return Response.json({})
  if (path.endsWith('/session')) return Response.json(null)
  if (path.endsWith('/csrf')) return Response.json({ csrfToken: 'preview' })
  return Response.json({})
}

export const GET = process.env.DATABASE_URL ? handlers.GET : previewAuth
export const POST = process.env.DATABASE_URL ? handlers.POST : previewAuth
