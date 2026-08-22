// ponytail: in-memory fixed-window limiter — per-instance only (serverless caveat);
// upgrade path: Redis/Upstash when running multi-region or when abuse actually appears.
const hits = new Map<string, number[]>()

export function allow(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 10_000) hits.clear()
  return true
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
