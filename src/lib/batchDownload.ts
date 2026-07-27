import { buildProxiedRequest, type CorsProxy } from './corsProxies'

export interface DownloadProgress {
  loaded: number
  total: number | null
}

export function filenameFromUrl(url: string, fallbackIndex: number): string {
  try {
    const { pathname } = new URL(url)
    const base = decodeURIComponent(pathname.split('/').filter(Boolean).pop() ?? '')
    if (base) return base
  } catch {
    // ignore malformed URL, fall through to fallback
  }
  return `file-${fallbackIndex + 1}`
}

export async function downloadWithProgress(
  url: string,
  proxy: CorsProxy,
  onProgress: (p: DownloadProgress) => void,
): Promise<Blob> {
  const built = buildProxiedRequest(proxy, url)

  let res: Response
  try {
    res = await fetch(built.url, { method: built.method, body: built.body })
  } catch {
    // The browser collapses network failures, DNS errors, and CORS blocks into
    // the same opaque "Failed to fetch" TypeError with no way to tell them apart.
    throw new Error('Blocked by CORS or unreachable')
  }

  if (!res.ok) {
    if (res.status === 404) throw new Error('File not found (404)')
    throw new Error(`Server error (HTTP ${res.status})`)
  }

  const totalHeader = res.headers.get('content-length')
  const total = totalHeader ? Number(totalHeader) : null

  if (!res.body) {
    const blob = await res.blob()
    onProgress({ loaded: blob.size, total: blob.size })
    return blob
  }

  const reader = res.body.getReader()
  const chunks: BlobPart[] = []
  let loaded = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value as BlobPart)
    loaded += value?.byteLength ?? 0
    onProgress({ loaded, total })
  }

  const type = res.headers.get('content-type') ?? undefined
  return new Blob(chunks, { type })
}

export async function runBatch<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}
