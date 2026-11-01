import type { RawCutoff } from '../../lib/data/normalize'

export type IngestFormat = 'json' | 'csv' | 'text' | 'pdf'

export type IngestSource = {
  id: string
  name: string
  url: string
  license: string
  format: IngestFormat
  fixture?: boolean
  fixtureFile?: string
}

export type ExtractInput = {
  bytes?: Uint8Array
  text?: string
  format: IngestFormat
}

export type RawIngestRecord = RawCutoff & {
  kind?: 'cutoff' | 'trend' | 'seat' | 'placement'
  externalId?: string
}
