import { useMemo, useState } from 'react'
import { Download, Image as ImageIcon } from 'lucide-react'
import { Dropzone } from '../components/Dropzone'
import { Card, SegmentedControl, Slider, PrimaryButton, StatRow } from '../components/ui'
import { SearchSelect, type SearchSelectOption } from '../components/SearchSelect'
import {
  compressImage,
  formatBytes,
  extensionFor,
  type CompressionMode,
  type ImageOutputFormat,
  type CompressResult,
} from '../lib/imageProcessing'

const FORMAT_OPTIONS: SearchSelectOption<ImageOutputFormat>[] = [
  { value: 'png', label: 'PNG', description: 'Lossless, supports transparency' },
  { value: 'jpeg', label: 'JPG', description: 'Lossy, small size' },
  { value: 'webp', label: 'WebP', description: 'Modern, great compression' },
  { value: 'avif', label: 'AVIF', description: 'Best compression, newer' },
  { value: 'bmp', label: 'BMP', description: 'Uncompressed bitmap' },
]

const MODE_OPTIONS: { value: CompressionMode; label: string }[] = [
  { value: 'quality', label: 'Target Quality' },
  { value: 'targetSize', label: 'Target Size' },
  { value: 'lossless', label: 'Lossless' },
]

export default function ImageTool() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<ImageOutputFormat>('webp')
  const [mode, setMode] = useState<CompressionMode>('quality')
  const [quality, setQuality] = useState(80)
  const [targetSizeKB, setTargetSizeKB] = useState(200)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<CompressResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  const resultUrl = useMemo(() => (result ? URL.createObjectURL(result.blob) : null), [result])

  const handleFile = (f: File) => {
    setFile(f)
    setResult(null)
    setError(null)
  }

  const handleCompress = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const res = await compressImage(file, {
        mode,
        format: mode === 'lossless' ? 'png' : format,
        quality: quality / 100,
        targetSizeKB,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setProcessing(false)
    }
  }

  const downloadName = file
    ? `${file.name.replace(/\.[^.]+$/, '')}.${extensionFor(mode === 'lossless' ? 'png' : format)}`
    : 'output'

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Image Compress & Convert</h1>
        <p className="mt-2 text-zinc-900/45 dark:text-white/45">
          Resize, compress, and convert PNG, JPG, and WebP images entirely in your browser.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Dropzone
            accept="image/*"
            file={file}
            onFile={handleFile}
            label="Drop an image here"
            hint="PNG, JPG, WebP, GIF, BMP, AVIF, SVG · click to browse"
          />

          {file && (
            <Card className="space-y-6">
              <div>
                <p className="mb-2 text-sm text-zinc-900/60 dark:text-white/60">Output format</p>
                <SearchSelect options={FORMAT_OPTIONS} value={format} onChange={setFormat} />
              </div>

              <div>
                <p className="mb-2 text-sm text-zinc-900/60 dark:text-white/60">Compression mode</p>
                <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} />
              </div>

              {mode === 'quality' && (
                <Slider
                  label="Quality"
                  value={quality}
                  min={1}
                  max={100}
                  onChange={setQuality}
                  displayValue={`${quality}%`}
                />
              )}

              {mode === 'targetSize' && (
                <Slider
                  label="Target size"
                  value={targetSizeKB}
                  min={5}
                  max={5000}
                  step={5}
                  onChange={setTargetSizeKB}
                  displayValue={formatBytes(targetSizeKB * 1024)}
                />
              )}

              {mode === 'lossless' && (
                <p className="text-sm text-zinc-900/40 dark:text-white/40">
                  Re-encodes as PNG with no quality loss. Output size depends only on image content.
                </p>
              )}

              <PrimaryButton onClick={handleCompress} loading={processing} className="w-full">
                {processing ? 'Compressing…' : 'Compress Image'}
              </PrimaryButton>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="flex min-h-[280px] items-center justify-center overflow-hidden !p-0">
            {resultUrl ? (
              <img src={resultUrl} alt="Compressed result" className="max-h-[420px] w-full object-contain p-4" />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-[420px] w-full object-contain p-4 opacity-60" />
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 text-zinc-900/25 dark:text-white/25">
                <ImageIcon className="h-10 w-10" />
                <p className="text-sm">Preview will appear here</p>
              </div>
            )}
          </Card>

          {result && (
            <Card className="space-y-5">
              <StatRow
                items={[
                  { label: 'Original', value: formatBytes(result.originalSize) },
                  { label: 'Output', value: formatBytes(result.outputSize) },
                  {
                    label: 'Reduction',
                    value: `${Math.max(
                      0,
                      Math.round((1 - result.outputSize / result.originalSize) * 100),
                    )}%`,
                  },
                  { label: 'Dimensions', value: `${result.width}×${result.height}` },
                ]}
              />
              <a
                href={resultUrl!}
                download={downloadName}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-900/15 bg-zinc-900/5 px-6 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-900/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Download {downloadName}
              </a>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
