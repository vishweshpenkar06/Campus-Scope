import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { isIP } from 'node:net'

const TIMEOUT_MS = 30_000

// Ingestion URLs come from the server-side registry, never from a user. Keep
// a basic SSRF guard anyway so a misconfigured/leaked source cannot hit the
// metadata service or a private network.
function assertPublicHost(hostname: string): void {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new Error(`Refusing private ingestion host: ${host}`)
  }
  if (!isIP(host)) return
  if (
    host === '::1' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new Error(`Refusing private ingestion address: ${host}`)
  }
}

export type FetchedSource = {
  url: string
  contentType: string
  bytes: Uint8Array
}

export async function fetchSource(url: string): Promise<FetchedSource> {
  const parsed = new URL(url)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Refusing non-HTTP source: ${url}`)
  }
  assertPublicHost(parsed.hostname)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'CampusScope ingestion (+https://campusscope.local)' },
    })
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`)
    return {
      url,
      contentType: response.headers.get('content-type') ?? '',
      bytes: new Uint8Array(await response.arrayBuffer()),
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function saveSnapshot(path: string, source: FetchedSource): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, source.bytes)
}
