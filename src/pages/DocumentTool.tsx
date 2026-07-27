import { useMemo, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Dropzone } from '../components/Dropzone'
import { Card, PrimaryButton, StatRow } from '../components/ui'
import { SearchSelect, type SearchSelectOption } from '../components/SearchSelect'
import { convertDocument, type DocOutputFormat } from '../lib/documentProcessing'
import { formatBytes } from '../lib/imageProcessing'

const FORMAT_OPTIONS: SearchSelectOption<DocOutputFormat>[] = [
  { value: 'pdf', label: 'PDF', description: 'Portable, print-ready' },
  { value: 'html', label: 'HTML', description: 'Web page' },
  { value: 'md', label: 'Markdown', description: 'Plain text with formatting' },
  { value: 'txt', label: 'TXT', description: 'Plain text' },
]

export default function DocumentTool() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<DocOutputFormat>('pdf')
  const [loading, setLoading] = useState(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resultUrl = useMemo(() => (resultBlob ? URL.createObjectURL(resultBlob) : null), [resultBlob])

  const handleFile = (f: File) => {
    setFile(f)
    setResultBlob(null)
    setPreviewHtml(null)
    setError(null)
  }

  const handleConvert = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const { blob, previewHtml } = await convertDocument(file, format)
      setResultBlob(blob)
      setPreviewHtml(previewHtml)
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
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Document Converter</h1>
        <p className="mt-2 text-zinc-900/45 dark:text-white/45">
          Convert between Word, HTML, Markdown, RTF, PDF, and plain text — right in your browser.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Dropzone
            accept=".docx,.html,.htm,.md,.markdown,.rtf,.txt"
            file={file}
            onFile={handleFile}
            label="Drop a document here"
            hint="DOCX, HTML, Markdown, RTF, or TXT · click to browse"
          />

          {file && (
            <Card className="space-y-6">
              <div>
                <p className="mb-2 text-sm text-zinc-900/60 dark:text-white/60">Output format</p>
                <SearchSelect options={FORMAT_OPTIONS} value={format} onChange={setFormat} />
              </div>

              <PrimaryButton onClick={handleConvert} loading={loading} className="w-full">
                {loading ? 'Converting…' : `Convert to ${format.toUpperCase()}`}
              </PrimaryButton>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="flex min-h-[280px] items-center justify-center overflow-hidden">
            {previewHtml ? (
              <div
                className="scrollbar-thin max-h-[420px] w-full overflow-y-auto rounded-lg bg-white p-6 text-sm text-black"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 text-zinc-900/25 dark:text-white/25">
                <FileText className="h-10 w-10" />
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
