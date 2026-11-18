import { afterEach, describe, expect, test, vi } from 'vitest'
import { allow, clientIp } from './rate-limit'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('rate limiter', () => {
  test('local fallback enforces the limit', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const key = `test-${Math.random()}`
    expect(await allow(key, 2, 1_000)).toBe(true)
    expect(await allow(key, 2, 1_000)).toBe(true)
    expect(await allow(key, 2, 1_000)).toBe(false)
  })

  test('Upstash result below the limit passes', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([{ result: 1 }, { result: 1 }])))
    expect(await allow('upstash-ok', 5)).toBe(true)
  })

  test('Upstash result above the limit fails', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([{ result: 6 }, { result: 1 }])))
    expect(await allow('upstash-blocked', 5)).toBe(false)
  })

  test('client IP prefers forwarded headers', () => {
    expect(
      clientIp(new Request('https://example.com', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } }))
    ).toBe('1.2.3.4')
  })
})
