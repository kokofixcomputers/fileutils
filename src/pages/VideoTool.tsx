import { useMemo, useState } from 'react'
import { Download, Video as VideoIcon } from 'lucide-react'
import { Dropzone } from '../components/Dropzone'
import { Card, SegmentedControl, Slider, PrimaryButton, StatRow } from '../components/ui'
import { SearchSelect, type SearchSelectOption } from '../components/SearchSelect'
import {
  convertVideo,
  type VideoOutputFormat,
  type VideoCompressionMode,
} from '../lib/videoProcessing'
import { formatBytes } from '../lib/imageProcessing'

const FORMAT_OPTIONS: SearchSelectOption<VideoOutputFormat>[] = [
  { value: 'mp4', label: 'MP4', description: 'Most compatible' },
  { value: 'webm', label: 'WebM', description: 'Smaller, web-native' },
  { value: 'mov', label: 'MOV', description: 'Apple QuickTime' },
  { value: 'gif', label: 'GIF', description: 'Looping animation, no audio' },
]

const MODE_OPTIONS: { value: VideoCompressionMode; label: string }[] = [
  { value: 'quality', label: 'Quality' },
  { value: 'targetSize', label: 'Target Size' },
]

export default function VideoTool() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<VideoOutputFormat>('mp4')
  const [mode, setMode] = useState<VideoCompressionMode>('quality')
  const [quality, setQuality] = useState(70)
  const [targetSizeMB, setTargetSizeMB] = useState(10)
  const [muteAudio, setMuteAudio] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resultUrl = useMemo(() => (resultBlob ? URL.createObjectURL(resultBlob) : null), [resultBlob])
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  const handleFile = (f: File) => {
    setFile(f)
    setResultBlob(null)
    setError(null)
  }

  const handleConvert = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setProgress(0)
    try {
      const blob = await convertVideo(file, {
        format,
        mode,
        quality,
        targetSizeMB,
        muteAudio: format === 'gif' ? true : muteAudio,
        onProgress: setProgress,
      })
      setResultBlob(blob)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const downloadName = file ? `${file.name.replace(/\.[^.]+$/, '')}.${format}` : `output.${format}`

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Video Converter & Compressor</h1>
        <p className="mt-2 text-zinc-900/45 dark:text-white/45">
          Convert between MP4, WebM, MOV, and GIF, or shrink a video to a target size. Powered by ffmpeg in your browser.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Dropzone
            accept="video/*"
            file={file}
            onFile={handleFile}
            label="Drop a video here"
            hint="MP4, WebM, MOV, AVI, MKV · click to browse"
          />

          {file && (
            <Card className="space-y-6">
              <div>
                <p className="mb-2 text-sm text-zinc-900/60 dark:text-white/60">Output format</p>
                <SearchSelect options={FORMAT_OPTIONS} value={format} onChange={setFormat} />
              </div>

              {format !== 'gif' && (
                <div>
                  <p className="mb-2 text-sm text-zinc-900/60 dark:text-white/60">Compression mode</p>
                  <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} />
                </div>
              )}

              {format !== 'gif' && mode === 'quality' && (
                <Slider
                  label="Quality"
                  value={quality}
                  min={1}
                  max={100}
                  onChange={setQuality}
                  displayValue={`${quality}%`}
                />
              )}

              {format !== 'gif' && mode === 'targetSize' && (
                <Slider
                  label="Target size"
                  value={targetSizeMB}
                  min={1}
                  max={500}
                  onChange={setTargetSizeMB}
                  displayValue={`${targetSizeMB} MB`}
                />
              )}

              {format !== 'gif' && (
                <label className="flex items-center gap-2 text-sm text-zinc-900/60 dark:text-white/60">
                  <input
                    type="checkbox"
                    checked={muteAudio}
                    onChange={(e) => setMuteAudio(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-accent)]"
                  />
                  Remove audio
                </label>
              )}

              <PrimaryButton onClick={handleConvert} loading={loading} className="w-full">
                {loading ? `Converting… ${Math.round(progress * 100)}%` : 'Convert Video'}
              </PrimaryButton>

              {loading && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] transition-all"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="flex min-h-[280px] items-center justify-center overflow-hidden !p-0">
            {resultUrl ? (
              format === 'gif' ? (
                <img src={resultUrl} alt="Converted result" className="max-h-[420px] w-full object-contain p-4" />
              ) : (
                <video src={resultUrl} controls className="max-h-[420px] w-full p-4" />
              )
            ) : previewUrl ? (
              <video src={previewUrl} controls className="max-h-[420px] w-full p-4 opacity-70" />
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 text-zinc-900/25 dark:text-white/25">
                <VideoIcon className="h-10 w-10" />
                <p className="text-sm">Preview will appear here</p>
              </div>
            )}
          </Card>

          {resultBlob && (
            <Card className="space-y-5">
              <StatRow
                items={[
                  { label: 'Original', value: file ? formatBytes(file.size) : '—' },
                  { label: 'Output', value: formatBytes(resultBlob.size) },
                  { label: 'Format', value: format.toUpperCase() },
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
