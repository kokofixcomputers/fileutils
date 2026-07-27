import { useCallback, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { UploadCloud, FileIcon } from 'lucide-react'
import clsx from 'clsx'

interface DropzoneProps {
  accept?: string
  onFile: (file: File) => void
  file: File | null
  label: string
  hint?: string
}

export function Dropzone({ accept, onFile, file, label, hint }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = e.dataTransfer.files?.[0]
      if (dropped) onFile(dropped)
    },
    [onFile],
  )

  return (
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
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/15">
            <FileIcon className="h-6 w-6 text-[var(--color-accent-2)]" />
          </div>
          <p className="font-medium text-zinc-900 dark:text-white">{file.name}</p>
          <p className="text-sm text-zinc-900/40 dark:text-white/40">{(file.size / 1024).toFixed(1)} KB &middot; click or drop to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900/5 transition-transform group-hover:scale-110 dark:bg-white/5">
            <UploadCloud className="h-7 w-7 text-zinc-900/50 dark:text-white/50" />
          </div>
          <p className="font-medium text-zinc-900/80 dark:text-white/80">{label}</p>
          {hint && <p className="text-sm text-zinc-900/35 dark:text-white/35">{hint}</p>}
        </div>
      )}
    </div>
  )
}
