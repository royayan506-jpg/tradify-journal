import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { TradeForm } from '../components/TradeForm'
import { Segmented, Sheet, SideChip } from '../components/ui'
import { setups } from '../lib/fixtures'
import { useJournal } from '../lib/store'
import { computeStats } from '../lib/stats'
import {
  cx,
  fmtDate,
  fmtHold,
  fmtMoney,
  fmtPct,
  fmtPrice,
  fmtR,
  fmtTime,
  pnlClass,
} from '../lib/format'
import type { Trade } from '../lib/types'

export const Route = createFileRoute('/app/journal')({ component: JournalPage })

type Result = 'all' | 'win' | 'loss'
type SortKey = 'closedAt' | 'pnl' | 'rMultiple' | 'symbol'

function JournalPage() {
  const { trades, addTrade, updateTrade, deleteTrade, notify } = useJournal()
  const [q, setQ] = useState('')
  const [result, setResult] = useState<Result>('all')
  const [setup, setSetup] = useState('all')
  const [side, setSide] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'closedAt', dir: -1 })
  const [limit, setLimit] = useState(25)
  const [selected, setSelected] = useState<Trade | null>(null)
  const [editing, setEditing] = useState<Trade | 'new' | null>(null)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return trades
      .filter(
        (t) =>
          (result === 'all' || (result === 'win' ? t.pnl > 0 : t.pnl <= 0)) &&
          (setup === 'all' || t.setup === setup) &&
          (side === 'all' || t.side === side) &&
          (!needle ||
            [t.symbol, t.setup, t.notes, t.emotion, ...t.tags].some((f) =>
              f.toLowerCase().includes(needle),
            )),
      )
      .sort((a, b) => {
        const av = a[sort.key]
        const bv = b[sort.key]
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv))
        return cmp * sort.dir
      })
  }, [trades, q, result, setup, side, sort])

  const s = useMemo(() => computeStats(rows), [rows])
  const toggleSort = (key: SortKey) =>
    setSort((cur) => ({ key, dir: cur.key === key ? (cur.dir === 1 ? -1 : 1) : -1 }))

  const Th = ({ k, children, right }: { k: SortKey; children: string; right?: boolean }) => (
    <th className={cx('py-3 font-semibold', right && 'text-right')}>
      <button
        onClick={() => toggleSort(k)}
        className={cx('uppercase tracking-wider transition hover:text-fg', sort.key === k && 'text-fg')}
      >
        {children}
        {sort.key === k && (sort.dir === 1 ? ' ↑' : ' ↓')}
      </button>
    </th>
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-rise">
          <h1 className="font-display text-5xl tracking-tight">Journal</h1>
          <p className="mt-1 text-muted">
            Every fill from TradingView, plus anything you log by hand.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          <Plus className="size-4" /> Log trade
        </button>
      </header>

      <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search trades</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search symbol, setup, tag, notes…"
            className="field !rounded-full pl-10"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Result"
            value={result}
            onChange={setResult}
            options={[
              { value: 'all', label: 'All' },
              { value: 'win', label: 'Wins' },
              { value: 'loss', label: 'Losses' },
            ]}
          />
          <select aria-label="Side" value={side} onChange={(e) => setSide(e.target.value)} className="field !w-auto !rounded-full !py-2">
            <option value="all">Long & short</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          <select aria-label="Setup" value={setup} onChange={(e) => setSetup(e.target.value)} className="field !w-auto !rounded-full !py-2">
            <option value="all">All setups</option>
            {setups.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-5">
        {[
          ['Trades', String(s.total), ''],
          ['Net P&L', fmtMoney(s.netPnl, { sign: true }), pnlClass(s.netPnl)],
          ['Win rate', fmtPct(s.winRate), ''],
          ['Avg win', fmtMoney(s.avgWin), 'text-gain'],
          ['Avg loss', fmtMoney(s.avgLoss), 'text-loss'],
        ].map(([label, value, cls]) => (
          <div key={label} className="bg-panel px-5 py-4">
            <div className="text-[11px] font-semibold tracking-wider text-dim uppercase">{label}</div>
            <div className={cx('num mt-1 text-lg font-semibold', cls)}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-left text-[11px] text-dim">
                <th className="w-2" />
                <Th k="symbol">Symbol</Th>
                <th className="py-3 font-semibold tracking-wider uppercase">Side</th>
                <th className="py-3 font-semibold tracking-wider uppercase">Setup</th>
                <th className="py-3 font-semibold tracking-wider uppercase">Entry → Exit</th>
                <Th k="closedAt">Closed</Th>
                <Th k="rMultiple" right>R</Th>
                <th className="px-6 py-3 text-right">
                  <button onClick={() => toggleSort('pnl')} className={cx('font-semibold uppercase tracking-wider hover:text-fg', sort.key === 'pnl' && 'text-fg')}>
                    P&L{sort.key === 'pnl' && (sort.dir === 1 ? ' ↑' : ' ↓')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="cursor-pointer border-t border-line/70 transition hover:bg-panel-2/60"
                >
                  <td className="pl-4">
                    <span className={cx('block h-8 w-1 rounded-full', t.pnl > 0 ? 'bg-gain' : 'bg-loss')} />
                  </td>
                  <td className="py-3.5 pl-3">
                    <div className="font-semibold">{t.symbol}</div>
                    <div className="text-[11px] text-dim">{t.market}</div>
                  </td>
                  <td className="py-3.5">
                    <SideChip side={t.side} />
                  </td>
                  <td className="py-3.5">
                    <div className="text-muted">{t.setup}</div>
                    {t.tags.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {t.tags.map((tag) => (
                          <span key={tag} className={cx('chip !px-2 !text-[10px]', tag === 'Rule break' ? 'bg-warn/12 text-warn' : 'bg-panel-2 text-muted')}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="num py-3.5 text-xs text-muted">
                    {fmtPrice(t.entry)} → {fmtPrice(t.exit)}
                  </td>
                  <td className="num py-3.5 text-xs text-muted">
                    {fmtDate(t.closedAt)} · {fmtTime(t.closedAt)}
                  </td>
                  <td className={cx('num py-3.5 text-right', pnlClass(t.rMultiple))}>{fmtR(t.rMultiple)}</td>
                  <td className={cx('num px-6 py-3.5 text-right font-semibold', pnlClass(t.pnl))}>
                    {fmtMoney(t.pnl, { sign: true, cents: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="p-12 text-center text-muted">No trades match these filters.</p>
          )}
        </div>
        {rows.length > limit && (
          <div className="border-t border-line p-4 text-center">
            <button className="btn-ghost" onClick={() => setLimit((l) => l + 25)}>
              Show more · {rows.length - limit} remaining
            </button>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.symbol} · ${fmtDate(selected.closedAt, { year: 'numeric' })}` : ''}>
        {selected && (
          <TradeDetail
            trade={selected}
            onEdit={() => {
              setEditing(selected)
              setSelected(null)
            }}
            onDelete={() => {
              deleteTrade(selected.id)
              setSelected(null)
            }}
          />
        )}
      </Sheet>

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Log a trade' : 'Edit trade'}
      >
        {editing && (
          <TradeForm
            initial={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSubmit={(t) => {
              if (editing === 'new') addTrade(t)
              else {
                updateTrade(editing.id, t)
                notify('Trade updated')
              }
              setEditing(null)
            }}
          />
        )}
      </Sheet>
    </div>
  )
}

function TradeDetail({ trade: t, onEdit, onDelete }: { trade: Trade; onEdit: () => void; onDelete: () => void }) {
  const hold = (Date.parse(t.closedAt) - Date.parse(t.openedAt)) / 60000
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <SideChip side={t.side} />
          <div className={cx('num mt-3 text-4xl font-semibold', pnlClass(t.pnl))}>
            {fmtMoney(t.pnl, { sign: true, cents: true })}
          </div>
          <div className={cx('num mt-1 text-sm', pnlClass(t.rMultiple))}>{fmtR(t.rMultiple)}</div>
        </div>
        <div className="text-right text-amber-300" aria-label={`Rated ${t.rating} of 5`}>
          {'★'.repeat(t.rating)}
          <span className="text-dim">{'★'.repeat(5 - t.rating)}</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
        {[
          ['Entry', fmtPrice(t.entry)],
          ['Exit', fmtPrice(t.exit)],
          ['Size', String(t.quantity)],
          ['Fees', fmtMoney(t.fees, { cents: true })],
          ['Opened', `${fmtDate(t.openedAt)} ${fmtTime(t.openedAt)}`],
          ['Held', fmtHold(hold)],
          ['Setup', t.setup],
          ['Emotion', t.emotion],
        ].map(([k, v]) => (
          <div key={k} className="bg-panel px-4 py-3">
            <dt className="text-[11px] tracking-wider text-dim uppercase">{k}</dt>
            <dd className="num mt-0.5">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <div className="label">Notes</div>
        <p className="rounded-xl border border-line bg-panel p-4 font-display text-xl leading-snug italic text-fg/90">
          “{t.notes || 'No notes yet.'}”
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-dim">
        <span>{t.source === 'tradingview' ? 'Imported from TradingView' : 'Logged manually'}</span>
        <span className="num">{t.id}</span>
      </div>

      <div className="flex gap-3 border-t border-line pt-5">
        <button className="btn-ghost flex-1" onClick={onEdit}>
          <Pencil className="size-4" /> Edit
        </button>
        <button className="btn-ghost flex-1 hover:!border-loss hover:!text-loss" onClick={onDelete}>
          <Trash2 className="size-4" /> Delete
        </button>
      </div>
    </div>
  )
}
