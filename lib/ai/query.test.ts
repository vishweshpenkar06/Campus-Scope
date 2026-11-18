import { afterEach, describe, expect, test, vi } from 'vitest'
import { parseQuery } from './query'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('ask provider chain', () => {
  test('uses deterministic rules when no provider keys are present', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    vi.stubEnv('CAMPUSLM_URL', '')
    const parsed = await parseQuery('85 percentile CS Pune')
    expect(parsed.provider).toBe('rules')
    expect(parsed.query).toMatchObject({
      intent: 'predict',
      percentile: 85,
      branch: 'Computer Engineering',
      city: 'Pune',
    })
  })

  test('accepts a validated Gemini slot extraction', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('CAMPUSLM_URL', '')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      intent: 'predict',
                      percentile: 88.5,
                      category: 'OBC',
                      branch: 'Computer Engineering',
                    }),
                  },
                ],
              },
            },
          ],
        })
      )
    )

    const parsed = await parseQuery('88.5 percentile OBC computer')
    expect(parsed.provider).toBe('gemini')
    expect(parsed.query).toMatchObject({ percentile: 88.5, category: 'OBC' })
  })

  test('falls back to rules when the provider errors', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('CAMPUSLM_URL', '')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))

    const parsed = await parseQuery('90 percentile SC Mumbai')
    expect(parsed.provider).toBe('rules')
    expect(parsed.query.percentile).toBe(90)
  })
})
