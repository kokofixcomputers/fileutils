import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { UploadCloud, FileIcon, X, ChevronUp, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface MultiDropzoneProps {
  accept?: string
  files: File[]
  onFiles: (files: File[]) => void
  label: string
  hint?: string
}

export function MultiDropzone({ accept, files, onFiles, label, hint }: MultiDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: FileList | File[]) => {
    onFiles([...files, ...Array.from(incoming)])
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const removeAt = (i: number) => onFiles(files.filter((_, idx) => idx !== i))
  const moveAt = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= files.length) return
    const next = [...files]
    ;[next[i], next[j]] = [next[j], next[i]]
    onFiles(next)
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200',
          isDragging
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 scale-[1.01]'
            : 'border-zinc-900/15 bg-zinc-900/[0.02] hover:border-zinc-900/30 hover:bg-zinc-900/[0.04] dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-white/30 dark:hover:bg-white/[0.04]',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900/5 transition-transform group-hover:scale-110 dark:bg-white/5">
            <UploadCloud className="h-7 w-7 text-zinc-900/50 dark:text-white/50" />
          </div>
          <p className="font-medium text-zinc-900/80 dark:text-white/80">{label}</p>
          {hint && <p className="text-sm text-zinc-900/35 dark:text-white/35">{hint}</p>}
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-zinc-900/10 bg-zinc-900/[0.02] px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-[var(--color-accent-2)]" />
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-900/80 dark:text-white/80">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-zinc-900/35 dark:text-white/35">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => moveAt(i, -1)}
                disabled={i === 0}
                className="shrink-0 rounded p-1 text-zinc-900/40 hover:text-zinc-900/80 disabled:opacity-20 dark:text-white/40 dark:hover:text-white/80"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => moveAt(i, 1)}
                disabled={i === files.length - 1}
                className="shrink-0 rounded p-1 text-zinc-900/40 hover:text-zinc-900/80 disabled:opacity-20 dark:text-white/40 dark:hover:text-white/80"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => removeAt(i)}
                className="shrink-0 rounded p-1 text-zinc-900/40 hover:text-red-400 dark:text-white/40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
