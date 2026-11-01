import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const TIMEOUT_MS = 30_000

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
