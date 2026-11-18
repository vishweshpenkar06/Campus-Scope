import { auth } from '@/lib/auth'

// ponytail: env allow-list until roles exist. One source of truth for every
// admin page and admin API route.
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export async function adminEmail(): Promise<string | null> {
  const admins = adminEmails()
  if (!admins.length) return null
  const session = await auth().catch(() => null)
  const email = session?.user?.email?.toLowerCase() ?? ''
  return email && admins.includes(email) ? email : null
}

export async function requireAdmin(): Promise<{ email: string } | null> {
  const email = await adminEmail()
  return email ? { email } : null
}
