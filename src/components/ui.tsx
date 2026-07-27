import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('glass rounded-2xl p-6', className)}>{children}</div>
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-zinc-900/10 bg-zinc-900/[0.03] p-1 dark:border-white/10 dark:bg-white/[0.03]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
            value === opt.value
              ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30'
              : 'text-zinc-900/50 hover:text-zinc-900/80 dark:text-white/50 dark:hover:text-white/80',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  displayValue,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  displayValue?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-zinc-900/60 dark:text-white/60">{label}</span>
        <span className="font-mono text-zinc-900/90 dark:text-white/90">{displayValue ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-900/10 accent-[var(--color-accent)] dark:bg-white/10"
        style={{
          background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--glass-border) ${pct}%)`,
        }}
      />
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-6 py-3 font-medium text-white transition-all duration-200',
        'hover:brightness-110 active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100',
        className,
      )}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  )
}

export function StatRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-6">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs uppercase tracking-wide text-zinc-900/35 dark:text-white/35">{item.label}</p>
          <p className="mt-1 font-mono text-lg text-zinc-900 dark:text-white">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
