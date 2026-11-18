import Link from 'next/link'
import { BadgeCheck, Languages, MapPin } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Counsellors — CampusScope',
  description: 'Talk to verified Maharashtra engineering admission counsellors.',
}

export default async function CounsellorsPage() {
  let counsellors: Array<{
    id: string
    displayName: string
    city: string
    languages: string[]
    bio: string
    priceRange: string | null
    verified: boolean
  }> = []
  try {
    counsellors = await prisma.counsellorProfile.findMany({
      orderBy: [{ verified: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        displayName: true,
        city: true,
        languages: true,
        bio: true,
        priceRange: true,
        verified: true,
      },
    })
  } catch {
    counsellors = []
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-12 pb-28 lg:px-8">
        <p className="eyebrow">Human help, when the numbers are not enough</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Talk to a counsellor.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          Directory listings are independent counsellors. CampusScope does not take a commission and
          does not verify their advice — ask about fees, experience, and references before you commit.
        </p>

        {counsellors.length ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {counsellors.map((counsellor) => (
              <Link
                key={counsellor.id}
                href={`/counsellors/${counsellor.id}`}
                className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-xl font-semibold group-hover:text-primary">
                    {counsellor.displayName}
                  </h2>
                  {counsellor.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <BadgeCheck className="size-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" /> {counsellor.city}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{counsellor.bio}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Languages className="size-3.5" /> {counsellor.languages.join(', ')}
                </p>
                {counsellor.priceRange && (
                  <p className="mt-2 text-xs font-semibold text-primary">{counsellor.priceRange}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
            <p className="font-semibold">No verified counsellor profiles yet.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              CampusScope is onboarding a small, verified group of Maharashtra admissions counsellors.
              We do not list unverified profiles. Use the feedback button if you want an introduction
              or want to apply as a counsellor.
            </p>
          </div>
        )}
      </main>
    </AppShell>
  )
}
