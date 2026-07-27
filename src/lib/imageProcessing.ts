export type ImageOutputFormat = 'png' | 'jpeg' | 'webp' | 'avif' | 'bmp'

export type CompressionMode = 'quality' | 'targetSize' | 'lossless'

export interface CompressOptions {
  mode: CompressionMode
  format: ImageOutputFormat
  quality?: number // 0-1, used when mode === 'quality'
  targetSizeKB?: number // used when mode === 'targetSize'
  maxWidth?: number
  maxHeight?: number
}

export interface CompressResult {
  blob: Blob
  width: number
  height: number
  quality: number
  originalSize: number
  outputSize: number
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

function drawToCanvas(img: HTMLImageElement, maxWidth?: number, maxHeight?: number) {
  let { naturalWidth: width, naturalHeight: height } = img

  if (maxWidth && width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }
  if (maxHeight && height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // Fill white background for formats without alpha (jpeg)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to encode image'))
      },
      mime,
      quality,
    )
  })
}

function mimeFor(format: ImageOutputFormat) {
  switch (format) {
    case 'png':
      return 'image/png'
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'avif':
      return 'image/avif'
    case 'bmp':
      return 'image/bmp'
  }
}

/**
 * Binary-searches the quality parameter to hit a target output size as
 * closely as possible without exceeding it (falls back to closest match
 * if the target is unreachable, e.g. below the format's floor size).
 */
async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  mime: string,
  targetBytes: number,
): Promise<{ blob: Blob; quality: number }> {
  let low = 0.01
  let high = 1
  let best: { blob: Blob; quality: number } | null = null

  // PNG and BMP have no quality knob in the canvas API — only width/height affects size.
  if (mime === 'image/png' || mime === 'image/bmp') {
    const blob = await canvasToBlob(canvas, mime)
    return { blob, quality: 1 }
  }

  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2
    const blob = await canvasToBlob(canvas, mime, mid)

    if (!best || Math.abs(blob.size - targetBytes) < Math.abs(best.blob.size - targetBytes)) {
      best = { blob, quality: mid }
    }

    if (blob.size > targetBytes) {
      high = mid
    } else {
      low = mid
    }
  }

  return best!
}

export async function compressImage(file: File, options: CompressOptions): Promise<CompressResult> {
  const img = await loadImage(file)
  let canvas = drawToCanvas(img, options.maxWidth, options.maxHeight)
  const mime = mimeFor(options.format)

  let blob: Blob
  let quality = 1

  if (options.mode === 'targetSize' && options.targetSizeKB) {
    const targetBytes = options.targetSizeKB * 1024
    let result = await compressToTargetSize(canvas, mime, targetBytes)

    // If still too large (e.g. PNG, or quality floor reached), progressively downscale.
    let attempts = 0
    while (result.blob.size > targetBytes && attempts < 6 && canvas.width > 32 && canvas.height > 32) {
      canvas = drawToCanvas(img, Math.round(canvas.width * 0.8), Math.round(canvas.height * 0.8))
      result = await compressToTargetSize(canvas, mime, targetBytes)
      attempts++
    }

    blob = result.blob
    quality = result.quality
  } else if (options.mode === 'lossless') {
    blob = await canvasToBlob(canvas, 'image/png')
    quality = 1
  } else {
    quality = options.quality ?? 0.85
    blob = await canvasToBlob(canvas, mime, quality)
  }

  URL.revokeObjectURL(img.src)

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    quality,
    originalSize: file.size,
    outputSize: blob.size,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function extensionFor(format: ImageOutputFormat): string {
  return format === 'jpeg' ? 'jpg' : format
}
