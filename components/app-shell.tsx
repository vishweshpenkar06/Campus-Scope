'use client'

import Link from 'next/link'
import { ArrowUpRight, GitCompareArrows, GraduationCap } from 'lucide-react'
import { CompareProvider } from './compare-context'
import { CompareTray } from './compare-tray'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      <header className="border-b border-foreground/10 bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="CampusScope home">
            <span className="grid size-9 place-items-center bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-serif text-2xl font-semibold tracking-tight">CampusScope</span>
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-1 text-sm">
            <Link
              href="/explore"
              className="px-3 py-2 text-muted-foreground transition hover:text-foreground"
            >
              Explore
            </Link>
            <Link
              href="/predictor"
              className="px-3 py-2 text-muted-foreground transition hover:text-foreground"
            >
              Predictor
            </Link>
            <Link
              href="/option-form"
              className="px-3 py-2 text-muted-foreground transition hover:text-foreground"
            >
              Option Form
            </Link>
            <Link
              href="/compare"
              className="ml-2 inline-flex items-center gap-2 border border-foreground/15 px-3 py-2 font-semibold transition hover:border-primary hover:text-primary"
            >
              <GitCompareArrows className="size-4" /> Compare{' '}
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <CompareTray />
    </CompareProvider>
  )
}
