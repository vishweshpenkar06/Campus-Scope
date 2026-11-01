// Optional OCR adapter for scanned PDFs. The base install does not include
// tesseract.js or a canvas backend; install both when a scanned source is added:
//   pnpm add -D tesseract.js @napi-rs/canvas
// The extraction path fails loudly rather than pretending a blank PDF is empty data.

const MAX_PAGES = 20

// Hide optional packages from the bundler: they are installed only when a
// scanned source is actually ingested.
const optionalImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<Record<string, unknown>>

export async function ocrPdf(bytes: Uint8Array): Promise<string> {
  let tesseract: { createWorker: (language: string) => Promise<OcrWorker> }
  try {
    tesseract = (await optionalImport('tesseract.js')) as unknown as {
      createWorker: (language: string) => Promise<OcrWorker>
    }
  } catch {
    throw new Error(
      'PDF has no text layer and OCR is not installed. Run `pnpm add -D tesseract.js @napi-rs/canvas` and retry.'
    )
  }

  const { getDocumentProxy, renderPageAsImage } = await import('unpdf')
  let canvasImport: (() => Promise<unknown>) | undefined
  try {
    const canvas = await optionalImport('@napi-rs/canvas')
    canvasImport = () => Promise.resolve(canvas)
  } catch {
    throw new Error('OCR needs a canvas backend. Run `pnpm add -D @napi-rs/canvas` and retry.')
  }

  const document = await getDocumentProxy(bytes)
  const pages = Math.min(document.numPages, MAX_PAGES)
  const worker = await tesseract.createWorker('eng')
  try {
    const chunks: string[] = []
    for (let page = 1; page <= pages; page++) {
      const image = await renderPageAsImage(document, page, {
        scale: 2,
        format: 'png',
        canvasImport: canvasImport as never,
      })
      const result = await worker.recognize(Buffer.from(image as Uint8Array))
      chunks.push(result.data.text)
    }
    return chunks.join('\n')
  } finally {
    await worker.terminate()
  }
}

type OcrWorker = {
  recognize: (image: Buffer) => Promise<{ data: { text: string } }>
  terminate: () => Promise<unknown>
}
