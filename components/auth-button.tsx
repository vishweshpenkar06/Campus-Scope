'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { LogIn, LogOut } from 'lucide-react'

export function AuthButton() {
  const { data: session, status } = useSession()
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    // empty providers map = no OAuth env keys on the server
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((providers) => setConfigured(Object.keys(providers ?? {}).length > 0))
      .catch(() => setConfigured(false))
  }, [])

  if (status === 'loading' || configured === null || !configured) return null

  return session ? (
    <span className="flex items-center gap-2">
      {session.user?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.user.image} alt="" className="size-7 rounded-full border border-border" />
      )}
      <button
        onClick={() => signOut()}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </span>
  ) : (
    <button
      onClick={() => signIn('google')}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
    >
      <LogIn className="size-4" />
      Sign in
    </button>
  )
}
