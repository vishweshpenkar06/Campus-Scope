import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

// ponytail: Google-only until SMTP/OAuth creds exist for Email magic links — add providers here as env keys land
const providers = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
  ...(process.env.RESEND_API_KEY
    ? [
        Resend({
          apiKey: process.env.RESEND_API_KEY,
          from: process.env.RESEND_FROM ?? 'CampusScope <onboarding@resend.dev>',
        }),
      ]
    : []),
]

export const authConfigured = providers.length > 0

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Vercel terminates TLS at its proxy; trust the forwarded host.
  trustHost: true,
  pages: { signIn: '/signin' },
  session: { strategy: 'jwt' },
  providers,
  callbacks: {
    async signIn({ user }) {
      // adapter creates the row; this guarantees email exists before shortlist writes
      return Boolean(user.email)
    },
    async session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub
      return session
    },
  },
})
