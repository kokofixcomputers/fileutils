import JSZip from 'jszip'

export async function createZip(files: File[], onProgress?: (ratio: number) => void): Promise<Blob> {
  const zip = new JSZip()
  files.forEach((file) => zip.file(file.name, file))
  return zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(metadata.percent / 100)
  })
}

export interface ExtractedEntry {
  name: string
  blob: Blob
  size: number
}

export async function extractZip(file: File, onProgress?: (ratio: number) => void): Promise<ExtractedEntry[]> {
  const zip = await JSZip.loadAsync(file)
  const entries = Object.values(zip.files).filter((f) => !f.dir)
  const results: ExtractedEntry[] = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const blob = await entry.async('blob')
    results.push({ name: entry.name, blob, size: blob.size })
    onProgress?.((i + 1) / entries.length)
  }

  return results
}
