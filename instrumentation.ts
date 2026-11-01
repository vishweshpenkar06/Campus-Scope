// Optional observability hook. Install @sentry/nextjs and set SENTRY_DSN to
// enable it; without both, this is a no-op and the app keeps its existing
// error boundaries and structured server logs.
const optionalImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<Record<string, unknown>>

let sentry: {
  captureException?: (error: unknown) => void
  captureRequestError?: (error: unknown, request: unknown, context: unknown) => void
} | null = null

export async function register() {
  if (!process.env.SENTRY_DSN) return
  try {
    const sdk = await optionalImport('@sentry/nextjs')
    const init = sdk.init as ((options: Record<string, unknown>) => void) | undefined
    init?.({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    })
    sentry = sdk as typeof sentry
  } catch {
    console.warn('[observability] SENTRY_DSN is set but @sentry/nextjs is not installed')
  }
}

export async function onRequestError(error: unknown, request: unknown, context: unknown) {
  sentry?.captureRequestError?.(error, request, context)
  sentry?.captureException?.(error)
}
