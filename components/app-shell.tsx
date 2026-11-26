'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, GitCompareArrows, GraduationCap, Menu, X } from 'lucide-react'
import { SessionProvider } from 'next-auth/react'
import { CompareProvider } from './compare-context'
import { CompareTray } from './compare-tray'
import { AuthButton } from './auth-button'
import { NotificationBell } from './notification-bell'
import { FeedbackButton } from './feedback/FeedbackButton'
import { OfflineBadge } from './pwa/OfflineBadge'

const MOBILE_LINKS = [
  { href: '/explore', label: 'Explore colleges' },
  { href: '/predictor', label: 'Predictor' },
  { href: '/simulator', label: 'Option simulator' },
  { href: '/documents', label: 'Documents' },
  { href: '/spot-rounds', label: 'Spot rounds' },
  { href: '/shortlist', label: 'My shortlist' },
  { href: '/counsellors', label: 'Counsellors' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <CompareProvider>
      <SessionProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <header className="border-b border-foreground/10 bg-background">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
            <Link href="/" className="flex items-center gap-3" aria-label="CampusScope home">
              <span className="grid size-9 place-items-center bg-primary text-primary-foreground">
                <GraduationCap className="size-5" />
              </span>
              <span className="font-serif text-2xl font-semibold tracking-tight">CampusScope</span>
            </Link>
            <nav aria-label="Primary navigation" className="hidden items-center gap-1 text-sm xl:flex">
              <Link href="/explore" className="px-3 py-2 text-muted-foreground transition hover:text-foreground">
                Explore
              </Link>
              <Link href="/predictor" className="px-3 py-2 text-muted-foreground transition hover:text-foreground">
                Predictor
              </Link>
              <Link href="/simulator" className="px-3 py-2 text-muted-foreground transition hover:text-foreground">
                Simulator
              </Link>
              <Link href="/documents" className="px-3 py-2 text-muted-foreground transition hover:text-foreground">
                Documents
              </Link>
              <Link href="/spot-rounds" className="px-3 py-2 text-muted-foreground transition hover:text-foreground">
                Spot Rounds
              </Link>
              <Link href="/shortlist" className="px-3 py-2 text-muted-foreground transition hover:text-foreground">
                My Shortlist
              </Link>
              <Link href="/counsellors" className="px-3 py-2 text-muted-foreground transition hover:text-foreground">
                Counsellors
              </Link>
              <Link
                href="/compare"
                className="ml-2 inline-flex items-center gap-2 border border-foreground/15 px-3 py-2 font-semibold transition hover:border-primary hover:text-primary"
              >
                <GitCompareArrows className="size-4" /> Compare{' '}
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <AuthButton />
              <CompareMobileNav />
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                className="inline-flex size-10 items-center justify-center border border-foreground/15 transition hover:border-primary hover:text-primary xl:hidden"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </header>
        {mobileOpen && (
          <div id="mobile-navigation" className="border-b border-foreground/10 bg-background xl:hidden">
            <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl gap-0.5 px-5 py-3">
              {MOBILE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/compare"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground"
              >
                <GitCompareArrows className="size-4" /> Compare selected
              </Link>
            </nav>
          </div>
        )}
        <div id="main-content" tabIndex={-1} className="min-h-[60vh]">
          {children}
        </div>
        <footer className="border-t border-foreground/10 bg-background">
          <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-serif text-2xl font-semibold tracking-tight">CampusScope</p>
                <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                  Independent admissions research for Maharashtra engineering aspirants. Every
                  published cutoff carries its source; unverified rows are flagged. Not an admission
                  guarantee.
                </p>
              </div>
              <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 pr-14 text-xs font-semibold text-muted-foreground sm:pr-0">
                <Link href="/explore" className="hover:text-primary">Explore</Link>
                <Link href="/predictor" className="hover:text-primary">Predictor</Link>
                <Link href="/counsellors" className="hover:text-primary">Counsellors</Link>
                <Link href="/documents" className="hover:text-primary">Documents</Link>
                <Link href="/methodology" className="hover:text-primary">Methodology</Link>
                <Link href="/alerts" className="hover:text-primary">Alerts</Link>
                <Link href="/guides" className="hover:text-primary">Guides</Link>
                <Link href="/about" className="hover:text-primary">About</Link>
                <Link href="/privacy" className="hover:text-primary">Privacy</Link>
                <Link href="/terms" className="hover:text-primary">Terms</Link>
                <a
                  href="https://cetcell.mahacet.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  Official CET Cell
                </a>
              </nav>
            </div>
            <p className="mt-7 border-t border-foreground/10 pt-4 text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} CampusScope · Built for students, not for rankings.
            </p>
          </div>
        </footer>
        <CompareTray />
        <FeedbackButton />
        <OfflineBadge />
      </SessionProvider>
    </CompareProvider>
  )
}

function CompareMobileNav() {
  return (
    <Link
      href="/compare"
      aria-label="Compare"
      className="inline-flex items-center border border-foreground/15 px-3 py-2 font-semibold transition hover:border-primary hover:text-primary xl:hidden"
    >
      <GitCompareArrows className="size-4" />
    </Link>
  )
}
