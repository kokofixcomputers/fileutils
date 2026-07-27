import { useMemo, useState } from 'react'
import { Download, FileStack as FileStackIcon } from 'lucide-react'
import { Dropzone } from '../components/Dropzone'
import { MultiDropzone } from '../components/MultiDropzone'
import { Card, SegmentedControl, PrimaryButton, StatRow } from '../components/ui'
import { SearchSelect, type SearchSelectOption } from '../components/SearchSelect'
import { mergePdfs, splitPdfToZip, pdfToImagesZip, type PdfImageFormat } from '../lib/pdfProcessing'
import { formatBytes } from '../lib/imageProcessing'

type PdfMode = 'merge' | 'split' | 'images'

const MODE_OPTIONS: { value: PdfMode; label: string }[] = [
  { value: 'merge', label: 'Merge' },
  { value: 'split', label: 'Split' },
  { value: 'images', label: 'To Images' },
]

const IMAGE_FORMAT_OPTIONS: SearchSelectOption<PdfImageFormat>[] = [
  { value: 'png', label: 'PNG', description: 'Lossless' },
  { value: 'jpeg', label: 'JPG', description: 'Smaller size' },
]

export default function PdfTool() {
  const [mode, setMode] = useState<PdfMode>('merge')
  const [mergeFiles, setMergeFiles] = useState<File[]>([])
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [imageFormat, setImageFormat] = useState<PdfImageFormat>('png')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultName, setResultName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resultUrl = useMemo(() => (resultBlob ? URL.createObjectURL(resultBlob) : null), [resultBlob])

  const resetResult = () => {
    setResultBlob(null)
    setError(null)
    setProgress(0)
  }

  const handleModeChange = (m: PdfMode) => {
    setMode(m)
    resetResult()
  }

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'merge') {
        if (mergeFiles.length < 2) throw new Error('Add at least two PDF files to merge.')
        const blob = await mergePdfs(mergeFiles)
        setResultBlob(blob)
        setResultName('merged.pdf')
      } else if (mode === 'split') {
        if (!singleFile) throw new Error('Add a PDF file to split.')
        const blob = await splitPdfToZip(singleFile)
        setResultBlob(blob)
        setResultName(`${singleFile.name.replace(/\.pdf$/i, '')}-pages.zip`)
      } else {
        if (!singleFile) throw new Error('Add a PDF file to convert.')
        const blob = await pdfToImagesZip(singleFile, { format: imageFormat, onProgress: setProgress })
        setResultBlob(blob)
        setResultName(`${singleFile.name.replace(/\.pdf$/i, '')}-images.zip`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canRun = mode === 'merge' ? mergeFiles.length >= 2 : !!singleFile

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">PDF Toolkit</h1>
        <p className="mt-2 text-zinc-900/45 dark:text-white/45">
          Merge multiple PDFs, split one into individual pages, or export pages as images — all in your browser.
        </p>
      </div>

      <div className="mb-6">
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={handleModeChange} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          {mode === 'merge' ? (
            <MultiDropzone
              accept="application/pdf"
              files={mergeFiles}
              onFiles={(f) => {
                setMergeFiles(f)
                resetResult()
              }}
              label="Drop PDF files here"
              hint="Add two or more · reorder with the arrows"
            />
          ) : (
            <Dropzone
              accept="application/pdf"
              file={singleFile}
              onFile={(f) => {
                setSingleFile(f)
                resetResult()
              }}
              label="Drop a PDF file here"
              hint="Click to browse"
            />
          )}

          {canRun && (
            <Card className="space-y-6">
              {mode === 'images' && (
                <div>
                  <p className="mb-2 text-sm text-zinc-900/60 dark:text-white/60">Image format</p>
                  <SearchSelect options={IMAGE_FORMAT_OPTIONS} value={imageFormat} onChange={setImageFormat} />
                </div>
              )}

              <PrimaryButton onClick={handleRun} loading={loading} className="w-full">
                {loading
                  ? mode === 'images'
                    ? `Converting… ${Math.round(progress * 100)}%`
                    : 'Processing…'
                  : mode === 'merge'
                    ? 'Merge PDFs'
                    : mode === 'split'
                      ? 'Split into Pages'
                      : 'Convert to Images'}
              </PrimaryButton>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-zinc-900/25 dark:text-white/25">
            <FileStackIcon className="h-10 w-10" />
            <p className="text-sm">
              {mode === 'merge'
                ? 'Merged PDF will be ready to download here'
                : mode === 'split'
                  ? 'A .zip of individual page PDFs will be ready here'
                  : 'A .zip of page images will be ready here'}
            </p>
          </Card>

          {resultBlob && (
            <Card className="space-y-5">
              <StatRow items={[{ label: 'Output size', value: formatBytes(resultBlob.size) }]} />
              <a
                href={resultUrl!}
                download={resultName}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-900/15 bg-zinc-900/5 px-6 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-900/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Download {resultName}
              </a>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
