import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BadgeCheck, Languages, MapPin } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { prisma } from '@/lib/prisma'
import { LeadForm } from '@/components/counsellors/LeadForm'

export const dynamic = 'force-dynamic'

export default async function CounsellorPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  let counsellor = null
  try {
    counsellor = await prisma.counsellorProfile.findUnique({
      where: { id },
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
    counsellor = null
  }

  if (!counsellor) notFound()

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-12 pb-28 lg:px-8">
        <Link href="/counsellors" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> All counsellors
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <section>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-4xl font-semibold tracking-tight">{counsellor.displayName}</h1>
              {counsellor.verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="size-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> {counsellor.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Languages className="size-4" /> {counsellor.languages.join(', ')}
              </span>
            </p>
            <p className="mt-6 whitespace-pre-line text-sm leading-7 text-muted-foreground">{counsellor.bio}</p>
            {counsellor.priceRange && (
              <p className="mt-5 rounded-lg border border-border bg-muted/50 p-3 text-sm font-semibold">
                {counsellor.priceRange}
              </p>
            )}
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              CampusScope lists independent counsellors and does not process payments. Confirm
              qualifications, fees, and refund terms directly. Never share OTPs, passwords, or
              payment credentials.
            </div>
          </section>

          <LeadForm counsellorId={counsellor.id} counsellorName={counsellor.displayName} />
        </div>
      </main>
    </AppShell>
  )
}
