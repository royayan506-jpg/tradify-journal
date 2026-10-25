import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, X } from 'lucide-react'
import { cx } from '../lib/format'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-8 place-items-center rounded-[10px] bg-accent text-ink shadow-[0_0_24px_-4px_var(--color-accent)]">
        <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden>
          <path
            d="M3 17l6-6 4 4 8-9"
            stroke="currentColor"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-display text-2xl leading-none tracking-tight">
        Tradify
      </span>
    </span>
  )
}

export function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => setM(true), [])
  return m
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
  delay = 0,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'gain' | 'loss' | 'neutral'
  icon?: ReactNode
  delay?: number
}) {
  return (
    <div
      className="card group relative overflow-hidden p-5 animate-rise transition hover:border-line-2"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between text-xs font-medium tracking-wide text-muted uppercase">
        {label}
        <span className="text-dim transition group-hover:text-accent">{icon}</span>
      </div>
      <div
        className={cx(
          'num mt-3 text-[1.7rem] font-semibold leading-none',
          tone === 'gain' && 'text-gain',
          tone === 'loss' && 'text-loss',
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-dim">{hint}</div>}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-full border border-line bg-ink-2 p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
            value === o.value
              ? 'bg-fg text-ink shadow'
              : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = 'right',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  side?: 'right' | 'center'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label={title}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade"
      />
      <div
        className={cx(
          'absolute flex flex-col border-line bg-ink-2 shadow-2xl',
          side === 'right'
            ? 'inset-y-0 right-0 w-full max-w-lg border-l animate-slide'
            : 'left-1/2 top-1/2 max-h-[90vh] w-[min(640px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border animate-fade',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-panel-2 hover:text-fg"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full border transition',
        checked ? 'border-accent bg-accent' : 'border-line-2 bg-panel-2',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 size-4.5 rounded-full transition-all',
          checked ? 'left-[22px] bg-ink' : 'left-0.5 bg-muted',
        )}
      />
    </button>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-semibold tracking-[0.18em] text-dim uppercase">
            {eyebrow}
          </div>
        )}
        <h2 className="mt-0.5 text-lg font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function SideChip({ side }: { side: 'long' | 'short' }) {
  return side === 'long' ? (
    <span className="chip bg-gain/12 text-gain">
      <ArrowUpRight className="size-3" /> Long
    </span>
  ) : (
    <span className="chip bg-loss/12 text-loss">
      <ArrowDownRight className="size-3" /> Short
    </span>
  )
}
