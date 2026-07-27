import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'

export interface SearchSelectOption<T extends string> {
  value: T
  label: string
  description?: string
}

interface SearchSelectProps<T extends string> {
  options: SearchSelectOption<T>[]
  value: T
  onChange: (v: T) => void
  placeholder?: string
}

export function SearchSelect<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Search formats…',
}: SearchSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    )
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlight(Math.max(0, options.findIndex((o) => o.value === value)))
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setHighlight(0)
  }, [query])

  const commit = (opt: SearchSelectOption<T>) => {
    onChange(opt.value)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(filtered.length - 1, h + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlight]
      if (opt) commit(opt)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-[220px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors',
          'border-zinc-900/10 bg-zinc-900/[0.03] text-zinc-900 hover:bg-zinc-900/[0.06]',
          'dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]',
          open && 'ring-2 ring-[var(--color-accent)]/50',
        )}
      >
        <span className="truncate">{selected?.label ?? 'Select…'}</span>
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-zinc-900/40 transition-transform dark:text-white/40',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          className="panel-solid absolute z-20 mt-2 w-full min-w-[240px] overflow-hidden rounded-xl shadow-2xl shadow-black/40"
        >
          <div className="flex items-center gap-2 border-b border-zinc-900/10 px-3 py-2 dark:border-white/10">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-900/40 dark:text-white/40" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-900/35 dark:text-white dark:placeholder:text-white/35"
            />
          </div>
          <div className="scrollbar-thin max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-zinc-900/40 dark:text-white/40">
                No formats found
              </p>
            )}
            {filtered.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => commit(opt)}
                className={clsx(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  i === highlight
                    ? 'bg-[var(--color-accent)]/15 text-zinc-900 dark:text-white'
                    : 'text-zinc-900/70 dark:text-white/70',
                )}
              >
                <span>
                  <span className="font-medium">{opt.label}</span>
                  {opt.description && (
                    <span className="ml-2 text-xs text-zinc-900/40 dark:text-white/40">
                      {opt.description}
                    </span>
                  )}
                </span>
                {opt.value === value && <Check className="h-3.5 w-3.5 text-[var(--color-accent-2)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
