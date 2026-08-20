'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { CollegeCard } from './college-card'
import type { CollegeListResponse } from '@/lib/types'

type Filters = { q: string; location: string; minFee: string; maxFee: string; minRating: string; page: number }

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search)
  return {
    q: params.get('q') ?? '',
    location: params.get('location') ?? '',
    minFee: params.get('minFee') ? String(Number(params.get('minFee')) / 100000) : '',
    maxFee: params.get('maxFee') ? String(Number(params.get('maxFee')) / 100000) : '',
    minRating: params.get('minRating') ?? '',
    page: Math.max(1, Number(params.get('page') ?? 1) || 1),
  }
}

export function CollegeExplorer() {
  const [filters, setFilters] = useState<Filters>({ q: '', location: '', minFee: '', maxFee: '', minRating: '', page: 1 })
  const [data, setData] = useState<CollegeListResponse | null>(null)
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setFilters(readFilters())
    fetch('/api/locations').then((response) => response.ok ? response.json() : Promise.reject()).then((body) => setLocations(body.data)).catch(() => setLocations([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    const params = new URLSearchParams({ page: String(filters.page), pageSize: '12' })
    if (filters.q) params.set('q', filters.q)
    if (filters.location) params.set('location', filters.location)
    if (filters.minFee) params.set('minFee', String(Number(filters.minFee) * 100000))
    if (filters.maxFee) params.set('maxFee', String(Number(filters.maxFee) * 100000))
    if (filters.minRating) params.set('minRating', filters.minRating)
    window.history.replaceState(null, '', `/?${params.toString()}`)
    try {
      const response = await fetch(`/api/colleges?${params}`)
      if (!response.ok) throw new Error()
      setData(await response.json())
    } catch { setError(true) } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])
  const activeCount = useMemo(() => [filters.q, filters.location, filters.minFee, filters.maxFee, filters.minRating].filter(Boolean).length, [filters])
  const update = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch, ...(patch.page === undefined ? { page: 1 } : {}) }))
  const reset = () => setFilters({ q: '', location: '', minFee: '', maxFee: '', minRating: '', page: 1 })

  return <section className="mx-auto max-w-7xl px-5 pb-28">
    <form onSubmit={(event) => { event.preventDefault(); load() }} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4 text-primary" /> Refine your shortlist {activeCount > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{activeCount} active</span>}</div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_110px_110px_130px_auto]">
        <label className="relative"><span className="sr-only">Search colleges</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><input value={filters.q} onChange={(event) => update({ q: event.target.value })} placeholder="Search by name or city" className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
        <label><span className="sr-only">Filter by location</span><select value={filters.location} onChange={(event) => update({ location: event.target.value })} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">All locations</option>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="sr-only">Minimum fee in lakhs</span><input value={filters.minFee} onChange={(event) => update({ minFee: event.target.value })} type="number" min="0" placeholder="Min ₹L" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
        <label><span className="sr-only">Maximum fee in lakhs</span><input value={filters.maxFee} onChange={(event) => update({ maxFee: event.target.value })} type="number" min="0" placeholder="Max ₹L" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
        <label><span className="sr-only">Minimum rating</span><select value={filters.minRating} onChange={(event) => update({ minRating: event.target.value })} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">Any rating</option><option value="4.5">4.5+ rated</option><option value="4">4.0+ rated</option><option value="3.5">3.5+ rated</option></select></label>
        <button type="button" onClick={reset} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:border-primary hover:text-primary"><RotateCcw className="size-4" /> Reset</button>
      </div>
    </form>
    <div className="mt-8 flex items-end justify-between"><div><p className="text-sm font-semibold text-primary">Explore the shortlist</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Find your next campus</h1></div>{data && <div className="text-right"><p className="text-sm text-muted-foreground">{data.meta.total} colleges</p>{(data as CollegeListResponse & { source?: string }).source === 'preview-demo' && <p className="mt-1 text-xs text-amber-700">Preview dataset</p>}</div>}</div>
    {error ? <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center"><p className="font-semibold">We couldn&apos;t load colleges.</p><button type="button" onClick={load} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button></div> : loading ? <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-xl bg-muted" />)}</div> : data?.data.length ? <><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.data.map((college) => <CollegeCard key={college.id} college={college} />)}</div><div className="mt-8 flex items-center justify-center gap-3"><button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-muted-foreground">Page {data.meta.page} of {Math.max(1, data.meta.totalPages)}</span><button disabled={filters.page >= data.meta.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">Next</button></div></> : <div className="mt-8 rounded-xl border border-dashed border-border p-14 text-center"><h2 className="font-semibold">No colleges match those filters</h2><p className="mt-2 text-sm text-muted-foreground">Try widening your fee range or clearing a filter.</p></div>}
  </section>
}
