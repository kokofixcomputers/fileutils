import { useMemo, useState } from 'react'
import { Download, FolderArchive, FileIcon } from 'lucide-react'
import { Dropzone } from '../components/Dropzone'
import { MultiDropzone } from '../components/MultiDropzone'
import { Card, SegmentedControl, PrimaryButton, StatRow } from '../components/ui'
import { createZip, extractZip, type ExtractedEntry } from '../lib/archiveProcessing'
import { formatBytes } from '../lib/imageProcessing'

type ArchiveMode = 'zip' | 'unzip'

const MODE_OPTIONS: { value: ArchiveMode; label: string }[] = [
  { value: 'zip', label: 'Create Zip' },
  { value: 'unzip', label: 'Extract Zip' },
]

export default function ArchiveTool() {
  const [mode, setMode] = useState<ArchiveMode>('zip')
  const [files, setFiles] = useState<File[]>([])
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [extracted, setExtracted] = useState<ExtractedEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const resultUrl = useMemo(() => (resultBlob ? URL.createObjectURL(resultBlob) : null), [resultBlob])

  const resetResult = () => {
    setResultBlob(null)
    setExtracted([])
    setError(null)
    setProgress(0)
  }

  const handleModeChange = (m: ArchiveMode) => {
    setMode(m)
    resetResult()
  }

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'zip') {
        if (files.length === 0) throw new Error('Add at least one file to zip.')
        const blob = await createZip(files, setProgress)
        setResultBlob(blob)
      } else {
        if (!zipFile) throw new Error('Add a .zip file to extract.')
        const entries = await extractZip(zipFile, setProgress)
        setExtracted(entries)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canRun = mode === 'zip' ? files.length > 0 : !!zipFile

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Zip & Unzip</h1>
        <p className="mt-2 text-zinc-900/45 dark:text-white/45">
          Bundle multiple files into a .zip, or extract files from an existing archive — all in your browser.
        </p>
      </div>

      <div className="mb-6">
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={handleModeChange} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          {mode === 'zip' ? (
            <MultiDropzone
              files={files}
              onFiles={(f) => {
                setFiles(f)
                resetResult()
              }}
              label="Drop files here"
              hint="Any file type · click to browse"
            />
          ) : (
            <Dropzone
              accept=".zip,application/zip"
              file={zipFile}
              onFile={(f) => {
                setZipFile(f)
                resetResult()
              }}
              label="Drop a .zip file here"
              hint="Click to browse"
            />
          )}

          {canRun && (
            <Card className="space-y-6">
              <PrimaryButton onClick={handleRun} loading={loading} className="w-full">
                {loading
                  ? `${mode === 'zip' ? 'Zipping' : 'Extracting'}… ${Math.round(progress * 100)}%`
                  : mode === 'zip'
                    ? 'Create Zip'
                    : 'Extract Files'}
              </PrimaryButton>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {mode === 'zip' ? (
            <>
              <Card className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-zinc-900/25 dark:text-white/25">
                <FolderArchive className="h-10 w-10" />
                <p className="text-sm">Your .zip will be ready to download here</p>
              </Card>
              {resultBlob && (
                <Card className="space-y-5">
                  <StatRow items={[{ label: 'Archive size', value: formatBytes(resultBlob.size) }]} />
                  <a
                    href={resultUrl!}
                    download="archive.zip"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-900/15 bg-zinc-900/5 px-6 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-900/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" />
                    Download archive.zip
                  </a>
                </Card>
              )}
            </>
          ) : (
            <Card className="space-y-1.5">
              {extracted.length === 0 ? (
                <div className="flex min-h-[168px] flex-col items-center justify-center gap-2 text-zinc-900/25 dark:text-white/25">
                  <FolderArchive className="h-10 w-10" />
                  <p className="text-sm">Extracted files will be listed here</p>
                </div>
              ) : (
                <ul className="scrollbar-thin max-h-96 space-y-1.5 overflow-y-auto">
                  {extracted.map((entry) => (
                    <li
                      key={entry.name}
                      className="flex items-center gap-3 rounded-xl border border-zinc-900/10 bg-zinc-900/[0.02] px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]"
                    >
                      <FileIcon className="h-4 w-4 shrink-0 text-[var(--color-accent-2)]" />
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-900/80 dark:text-white/80">
                        {entry.name}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-900/35 dark:text-white/35">
                        {formatBytes(entry.size)}
                      </span>
                      <a
                        href={URL.createObjectURL(entry.blob)}
                        download={entry.name.split('/').pop()}
                        className="shrink-0 rounded p-1 text-zinc-900/40 hover:text-[var(--color-accent-2)] dark:text-white/40"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
