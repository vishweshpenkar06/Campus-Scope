// Production uses Upstash REST when configured; local/dev falls back to a
// per-instance fixed window. The in-memory fallback is intentionally small and
// resets under load — it is not a substitute for Redis in multi-region.
const hits = new Map<string, number[]>()

export async function allow(key: string, limit = 20, windowMs = 60_000): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  const window = Math.floor(Date.now() / windowMs)

  if (url && token) {
    try {
      const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', `ratelimit:${key}:${window}`],
          ['EXPIRE', `ratelimit:${key}:${window}`, Math.ceil(windowMs / 1000), 'NX'],
        ]),
        signal: AbortSignal.timeout(1500),
      })
      if (response.ok) {
        const body = (await response.json()) as Array<{ result?: number }>
        const count = Number(body[0]?.result ?? 0)
        if (Number.isFinite(count)) return count <= limit
      }
    } catch {
      // fall through to the local limiter rather than taking the API down
    }
  }

  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
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
