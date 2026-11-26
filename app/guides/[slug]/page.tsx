import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { GUIDES, getGuide } from '@/lib/content/guides'
import { SITE_URL } from '@/lib/seo'

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const guide = getGuide((await params).slug)
  if (!guide) return { title: 'Guide not found — CampusScope' }
  return {
    title: `${guide.title} — CampusScope`,
    description: guide.description,
    alternates: { canonical: `${SITE_URL}/guides/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.description, type: 'article' },
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug)
  if (!guide) notFound()

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        dateModified: guide.updated,
        author: { '@type': 'Organization', name: 'CampusScope' },
        mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 py-12 pb-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />

        <nav className="text-xs text-muted-foreground">
          <Link href="/guides" className="hover:text-primary">Guides</Link> / <span>{guide.title}</span>
        </nav>

        <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{guide.title}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{guide.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">Updated {guide.updated} · Educational guide, not admission advice</p>

        <section className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h2 className="font-serif text-xl font-semibold">Key points</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6">
            {guide.keyPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {guide.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="font-serif text-2xl font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-3 text-sm leading-7 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">Questions students ask</h2>
          <div className="mt-4 grid gap-3">
            {guide.faqs.map((faq) => (
              <details key={faq.question} className="rounded-xl border border-border bg-card p-4">
                <summary className="cursor-pointer text-sm font-semibold">{faq.question}</summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">Put it into practice</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/predictor" className="text-primary hover:underline">Check your matches →</Link>
            <Link href="/option-form" className="text-primary hover:underline">Practise the option form →</Link>
            <Link href="/methodology" className="text-primary hover:underline">See where our data comes from →</Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Always verify rules, dates, and seat data on the official CET Cell portal. CampusScope is
            an independent research tool, not the admission authority.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold">Read next</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {GUIDES.filter((item) => item.slug !== guide.slug).map((item) => (
              <Link
                key={item.slug}
                href={`/guides/${item.slug}`}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
