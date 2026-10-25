export const fmtMoney = (v: number | null, opts: { sign?: boolean; cents?: boolean } = {}) => {
  if (v === null || !Number.isFinite(v)) return '—'
  const s = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(Math.abs(v))
  if (v < 0) return `−${s}`
  return opts.sign && v > 0 ? `+${s}` : s
}

export const fmtPct = (v: number | null, digits = 1) =>
  v === null || !Number.isFinite(v) ? '—' : `${(v * 100).toFixed(digits)}%`

export const fmtNum = (v: number | null, digits = 2) =>
  v === null || !Number.isFinite(v) ? '—' : v.toFixed(digits)

export const fmtR = (v: number | null) =>
  v === null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}R`

export const fmtPrice = (v: number) =>
  v < 10 ? v.toFixed(5) : v.toLocaleString('en-US', { maximumFractionDigits: 2 })

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...opts,
  })

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })

export const fmtMonth = (key: string, style: 'long' | 'short' = 'long') => {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: style,
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const fmtHold = (minutes: number | null) => {
  if (minutes === null) return '—'
  if (minutes < 60) return `${Math.round(minutes)}m`
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`
}

export const pnlClass = (v: number) =>
  v > 0 ? 'text-gain' : v < 0 ? 'text-loss' : 'text-muted'

export const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(' ')
