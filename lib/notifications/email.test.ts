import { afterEach, describe, expect, test, vi } from 'vitest'
import { sendAlertEmail } from './email'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('alert email', () => {
  test('queues without a key', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    expect(await sendAlertEmail('student@example.com', 'Test', ['Line'])).toBe('queued')
  })

  test('sends through Resend with a key', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    const fetchMock = vi.fn(async () => Response.json({ id: 'ok' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendAlertEmail('student@example.com', 'Test', ['Line'])).toBe('sent')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('reports provider failures', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 500 })))
    expect(await sendAlertEmail('student@example.com', 'Test', ['Line'])).toBe('failed')
  })
})
