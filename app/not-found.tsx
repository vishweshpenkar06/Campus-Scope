import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">This page isn&apos;t on the map</h1>
      <p className="mt-3 text-muted-foreground">
        The college or page you were looking for may have moved — the directory is a good place to restart.
      </p>
      <Link href="/explore" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
        Browse colleges
      </Link>
    </main>
  )
}
