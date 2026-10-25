import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dailyPnl } from '../lib/stats'
import { cx, fmtMoney, fmtMonth } from '../lib/format'
import type { Trade } from '../lib/types'

export function PnlCalendar({ trades, initialMonth }: { trades: Trade[]; initialMonth: string }) {
  const [month, setMonth] = useState(initialMonth)
  const daily = useMemo(() => dailyPnl(trades), [trades])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of trades) m.set(t.closedAt.slice(0, 10), (m.get(t.closedAt.slice(0, 10)) ?? 0) + 1)
    return m
  }, [trades])

  const [y, m] = month.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1))
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const lead = first.getUTCDay()
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const maxAbs = Math.max(
    1,
    ...[...daily.entries()].filter(([d]) => d.startsWith(month)).map(([, v]) => Math.abs(v)),
  )
  const monthTotal = [...daily.entries()]
    .filter(([d]) => d.startsWith(month))
    .reduce((s, [, v]) => s + v, 0)

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1))
    setMonth(d.toISOString().slice(0, 7))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{fmtMonth(month)}</div>
          <div className={cx('num text-xs', monthTotal >= 0 ? 'text-gain' : 'text-loss')}>
            {fmtMoney(monthTotal, { sign: true })}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="rounded-full p-1.5 text-muted transition hover:bg-panel-2 hover:text-fg"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => shift(1)}
            aria-label="Next month"
            className="rounded-full p-1.5 text-muted transition hover:bg-panel-2 hover:text-fg"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold tracking-wider text-dim uppercase">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const key = `${month}-${String(day).padStart(2, '0')}`
          const v = daily.get(key)
          const intensity = v ? 0.18 + (Math.abs(v) / maxAbs) * 0.62 : 0
          return (
            <div
              key={i}
              title={v ? `${key}: ${fmtMoney(v, { sign: true })} · ${counts.get(key)} trades` : key}
              className={cx(
                'relative flex aspect-square flex-col justify-between rounded-lg border p-1.5 text-left transition hover:scale-[1.06]',
                v ? 'border-transparent' : 'border-line/60',
              )}
              style={
                v
                  ? {
                      backgroundColor:
                        v > 0
                          ? `rgb(94 224 160 / ${intensity})`
                          : `rgb(255 107 122 / ${intensity})`,
                    }
                  : undefined
              }
            >
              <span className={cx('text-[10px] font-semibold', v ? 'text-fg' : 'text-dim')}>{day}</span>
              {v !== undefined && (
                <span className="num hidden truncate text-[9px] font-semibold text-fg sm:block">
                  {Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
