export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 pb-28">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-10 w-96 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-5 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-11 w-40 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-8 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
