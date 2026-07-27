import { useState } from 'react'
import { Check, Copy, Hash as HashIcon } from 'lucide-react'
import { Dropzone } from '../components/Dropzone'
import { Card, PrimaryButton } from '../components/ui'
import { computeFileHashes, type FileHashes } from '../lib/hashProcessing'

const LABELS: { key: keyof FileHashes; label: string }[] = [
  { key: 'md5', label: 'MD5' },
  { key: 'sha1', label: 'SHA-1' },
  { key: 'sha256', label: 'SHA-256' },
  { key: 'sha512', label: 'SHA-512' },
]

export default function HashTool() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [hashes, setHashes] = useState<FileHashes | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setHashes(null)
    setError(null)
  }

  const handleCompute = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const result = await computeFileHashes(file)
      setHashes(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">File Hash / Checksum</h1>
        <p className="mt-2 text-zinc-900/45 dark:text-white/45">
          Compute MD5, SHA-1, SHA-256, and SHA-512 checksums to verify file integrity — entirely in your browser.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Dropzone file={file} onFile={handleFile} label="Drop a file here" hint="Any file type · click to browse" />

          {file && (
            <Card className="space-y-6">
              <PrimaryButton onClick={handleCompute} loading={loading} className="w-full">
                {loading ? 'Computing…' : 'Compute Hashes'}
              </PrimaryButton>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {!hashes ? (
            <Card className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-zinc-900/25 dark:text-white/25">
              <HashIcon className="h-10 w-10" />
              <p className="text-sm">Checksums will appear here</p>
            </Card>
          ) : (
            <Card className="space-y-4">
              {LABELS.map(({ key, label }) => (
                <div key={key}>
                  <p className="mb-1.5 text-xs uppercase tracking-wide text-zinc-900/35 dark:text-white/35">
                    {label}
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-900/10 bg-zinc-900/[0.02] px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
                    <code className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-900/80 dark:text-white/80">
                      {hashes[key]}
                    </code>
                    <button
                      onClick={() => copy(key, hashes[key])}
                      className="shrink-0 rounded p-1 text-zinc-900/40 hover:text-[var(--color-accent-2)] dark:text-white/40"
                    >
                      {copied === key ? (
                        <Check className="h-4 w-4 text-[var(--color-accent-2)]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
