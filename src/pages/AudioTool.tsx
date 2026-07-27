import { useMemo, useState } from 'react'
import { Download, AudioLines } from 'lucide-react'
import { Dropzone } from '../components/Dropzone'
import { Card, Slider, PrimaryButton, StatRow } from '../components/ui'
import { SearchSelect, type SearchSelectOption } from '../components/SearchSelect'
import { convertAudio, type AudioOutputFormat } from '../lib/audioProcessing'
import { formatBytes } from '../lib/imageProcessing'

const FORMAT_OPTIONS: SearchSelectOption<AudioOutputFormat>[] = [
  { value: 'mp3', label: 'MP3', description: 'Universal, lossy' },
  { value: 'wav', label: 'WAV', description: 'Uncompressed, lossless' },
  { value: 'ogg', label: 'OGG', description: 'Open format, lossy' },
  { value: 'flac', label: 'FLAC', description: 'Compressed, lossless' },
  { value: 'aac', label: 'AAC', description: 'Efficient, lossy' },
]

const LOSSY_FORMATS: AudioOutputFormat[] = ['mp3', 'ogg', 'aac']

export default function AudioTool() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<AudioOutputFormat>('mp3')
  const [bitrate, setBitrate] = useState(192)
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resultUrl = useMemo(() => (resultBlob ? URL.createObjectURL(resultBlob) : null), [resultBlob])

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
    setLoadingStage('Loading converter engine…')
    try {
      const blob = await convertAudio(file, {
        format,
        bitrateKbps: bitrate,
        onProgress: (ratio) => {
          setLoadingStage('Converting…')
          setProgress(ratio)
        },
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
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Audio Converter</h1>
        <p className="mt-2 text-zinc-900/45 dark:text-white/45">
          Convert between MP3, WAV, OGG, FLAC, and AAC. Powered by ffmpeg running in your browser via WebAssembly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Dropzone
            accept="audio/*"
            file={file}
            onFile={handleFile}
            label="Drop an audio file here"
            hint="MP3, WAV, OGG, FLAC, AAC, M4A · click to browse"
          />

          {file && (
            <Card className="space-y-6">
              <div>
                <p className="mb-2 text-sm text-zinc-900/60 dark:text-white/60">Output format</p>
                <SearchSelect options={FORMAT_OPTIONS} value={format} onChange={setFormat} />
              </div>

              {LOSSY_FORMATS.includes(format) && (
                <Slider
                  label="Bitrate"
                  value={bitrate}
                  min={64}
                  max={320}
                  step={16}
                  onChange={setBitrate}
                  displayValue={`${bitrate} kbps`}
                />
              )}

              <PrimaryButton onClick={handleConvert} loading={loading} className="w-full">
                {loading ? loadingStage : 'Convert Audio'}
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
          <Card className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-zinc-900/25 dark:text-white/25">
            <AudioLines className="h-10 w-10" />
            {resultUrl ? (
              <audio controls src={resultUrl} className="w-full max-w-xs" />
            ) : file ? (
              <audio controls src={URL.createObjectURL(file)} className="w-full max-w-xs opacity-70" />
            ) : (
              <p className="text-sm">Preview will appear here</p>
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
