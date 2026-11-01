import type { IngestSource } from './types'

// Only sources with a verified, official URL belong here. The DTE entry
// intentionally has no invented deep link: pass the current PDF/HTML URL with
// `--url` or set DTE_CUTOFF_URL after checking the official portal.
export const SOURCES: Record<string, IngestSource> = {
  'fixture-2025': {
    id: 'fixture-2025',
    name: 'fixture-2025',
    url: 'https://example.invalid/fixture-dte-2025/cutoffs.json',
    license: 'Synthetic fixture — never publish',
    format: 'json',
    fixture: true,
    fixtureFile: 'dte-2025.json',
  },
  'dte-2025': {
    id: 'dte-2025',
    name: 'dte-2025',
    url: '',
    license: 'Government of Maharashtra — public information',
    format: 'pdf',
  },
}

export function resolveSource(id: string, urlOverride?: string): IngestSource {
  const source = SOURCES[id]
  if (!source) throw new Error(`Unknown source "${id}". Known: ${Object.keys(SOURCES).join(', ')}`)
  const url = urlOverride || process.env.DTE_CUTOFF_URL || source.url
  if (!url) {
    throw new Error(
      `Source "${id}" needs an official URL. Pass --url or set DTE_CUTOFF_URL after verifying it on cetcell.mahacet.org.`
    )
  }
  return { ...source, url }
}
