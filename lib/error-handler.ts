export function logError(error: unknown, context: string) {
  // ponytail: Minimalistic logging. Upgrade path: add Sentry/LogRocket integration.
  console.error(`[${context}]`, error)
}
