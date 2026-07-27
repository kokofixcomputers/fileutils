import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import JSZip from 'jszip'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export async function mergePdfs(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create()

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const doc = await PDFDocument.load(bytes)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    pages.forEach((page) => merged.addPage(page))
  }

  const bytes = await merged.save()
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' })
}

export async function getPdfPageCount(file: File): Promise<number> {
  const bytes = await file.arrayBuffer()
  const doc = await PDFDocument.load(bytes)
  return doc.getPageCount()
}

/** Splits a PDF into one file per page, bundled into a zip. */
export async function splitPdfToZip(file: File): Promise<Blob> {
  const bytes = await file.arrayBuffer()
  const source = await PDFDocument.load(bytes)
  const pageCount = source.getPageCount()
  const baseName = file.name.replace(/\.pdf$/i, '')

  const zip = new JSZip()

  for (let i = 0; i < pageCount; i++) {
    const doc = await PDFDocument.create()
    const [page] = await doc.copyPages(source, [i])
    doc.addPage(page)
    const pageBytes = await doc.save()
    zip.file(`${baseName}-page-${i + 1}.pdf`, pageBytes)
  }

  return zip.generateAsync({ type: 'blob' })
}

export type PdfImageFormat = 'png' | 'jpeg'

export interface PdfToImagesOptions {
  format: PdfImageFormat
  scale?: number
  onProgress?: (ratio: number) => void
}

/** Rasterizes every page of a PDF into an image, bundled into a zip. */
export async function pdfToImagesZip(file: File, options: PdfToImagesOptions): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const baseName = file.name.replace(/\.pdf$/i, '')
  const zip = new JSZip()
  const mime = options.format === 'png' ? 'image/png' : 'image/jpeg'
  const ext = options.format === 'png' ? 'png' : 'jpg'

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: options.scale ?? 2 })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')

    await page.render({ canvas, canvasContext: ctx, viewport }).promise

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode page'))), mime, 0.92)
    })

    zip.file(`${baseName}-page-${i}.${ext}`, blob)
    options.onProgress?.(i / pdf.numPages)
  }

  return zip.generateAsync({ type: 'blob' })
}
