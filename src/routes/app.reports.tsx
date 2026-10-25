import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, Download, Lightbulb, Mail, TriangleAlert } from 'lucide-react'
import { DailyBars } from '../components/charts'
import { SectionTitle } from '../components/ui'
import { useJournal } from '../lib/store'
import {
  computeStats,
  dailyPnl,
  groupBy,
  insightsFor,
  monthKey,
  previousMonthKey,
  tradesInMonth,
  weekdays,
} from '../lib/stats'
import { cx, fmtDate, fmtHold, fmtMoney, fmtMonth, fmtNum, fmtPct, fmtR, pnlClass } from '../lib/format'

export const Route = createFileRoute('/app/reports')({ component: ReportsPage })

function ReportsPage() {
  const { trades, workspace, now } = useJournal()
  const current = monthKey(now.toISOString())
  const months = useMemo(
    () => [...new Set(trades.map((t) => monthKey(t.closedAt)))].sort().reverse(),
    [trades],
  )
  const issued = months.filter((m) => m < current)
  const [selected, setSelected] = useState(issued[0] ?? current)

  const issueDate = (key: string) => {
    const [y, m] = key.split('-').map(Number)
    return new Date(Date.UTC(y, m, workspace.reportDay)).toISOString()
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-5xl tracking-tight">Monthly reports</h1>
        <p className="mt-1 text-muted">
          A full performance review lands in your inbox on the {ordinal(workspace.reportDay)} of every month.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2 lg:sticky lg:top-8 lg:self-start print:hidden">
          <div className="card flex items-center gap-3 border-dashed p-4">
            <Clock className="size-5 shrink-0 text-accent" />
            <div className="text-sm">
              <div className="font-semibold">{fmtMonth(current)}</div>
              <div className="text-xs text-dim">Issues {fmtDate(issueDate(current), { year: 'numeric' })}</div>
            </div>
          </div>
          {issued.map((m) => {
            const s = computeStats(tradesInMonth(trades, m))
            return (
              <button
                key={m}
                onClick={() => setSelected(m)}
                className={cx(
                  'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition',
                  selected === m
                    ? 'border-accent/50 bg-panel shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent)_10%,transparent)]'
                    : 'border-line hover:border-line-2 hover:bg-panel/60',
                )}
              >
                <div>
                  <div className="text-sm font-semibold">{fmtMonth(m)}</div>
                  <div className="text-xs text-dim">{s.total} trades · {fmtPct(s.winRate, 0)} WR</div>
                </div>
                <span className={cx('num text-sm font-semibold', pnlClass(s.netPnl))}>
                  {fmtMoney(s.netPnl, { sign: true })}
                </span>
              </button>
            )
          })}
        </aside>

        <Report key={selected} month={selected} issuedAt={issueDate(selected)} />
      </div>
    </div>
  )
}

function Report({ month, issuedAt }: { month: string; issuedAt: string }) {
  const { trades, workspace } = useJournal()
  const list = useMemo(() => tradesInMonth(trades, month), [trades, month])
  const prevList = useMemo(() => tradesInMonth(trades, previousMonthKey(month)), [trades, month])
  const s = computeStats(list)
  const p = computeStats(prevList)
  const insights = insightsFor(list, prevList)
  const bars = [...dailyPnl(list).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, pnl]) => ({ day, pnl }))
  const bySetup = groupBy(list, (t) => t.setup)
  const byMarket = groupBy(list, (t) => t.market)
  const byDay = groupBy(list, (t) => weekdays[new Date(t.closedAt).getUTCDay()]).sort(
    (a, b) => weekdays.indexOf(a.name) - weekdays.indexOf(b.name),
  )
  const maxDay = Math.max(1, ...byDay.map((d) => Math.abs(d.netPnl)))
  const discipline = list.length
    ? list.filter((t) => !t.tags.includes('Rule break')).length / list.length
    : null
  const goalHit = s.netPnl >= workspace.monthlyGoal

  return (
    <article className="card overflow-hidden animate-rise">
      <div className="relative overflow-hidden border-b border-line p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] text-dim uppercase">
              Performance report · Issued {fmtDate(issuedAt, { year: 'numeric' })}
            </div>
            <h2 className="mt-3 font-display text-5xl leading-none tracking-tight sm:text-6xl">
              {fmtMonth(month).split(' ')[0]} <em className="text-muted">{month.slice(0, 4)}</em>
            </h2>
            <p className="mt-3 text-sm text-muted">Prepared for {workspace.traderName}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button className="btn-ghost !px-4 !py-2 text-xs" onClick={() => window.print()}>
              <Download className="size-3.5" /> PDF
            </button>
            <span className="chip border border-line bg-ink-2 !py-2 text-muted">
              <Mail className="size-3.5" /> Emailed
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Headline label="Net P&L" value={fmtMoney(s.netPnl, { sign: true })} cls={pnlClass(s.netPnl)} delta={delta(s.netPnl, p.netPnl, 'money')} />
          <Headline label="Win rate" value={fmtPct(s.winRate)} delta={delta(s.winRate, p.winRate, 'pts')} />
          <Headline label="Profit factor" value={fmtNum(s.profitFactor)} delta={delta(s.profitFactor, p.profitFactor, 'num')} />
          <Headline label="Trades" value={String(s.total)} delta={delta(s.total, p.total, 'count')} />
        </div>
      </div>

      <div className="space-y-10 p-8 sm:p-10">
        <section>
          <SectionTitle eyebrow="Day by day" title="Daily net P&L" />
          <DailyBars points={bars} />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className={cx('rounded-2xl border p-5', goalHit ? 'border-gain/40 bg-gain/5' : 'border-line bg-ink-2')}>
            <div className="text-xs text-muted">Monthly goal</div>
            <div className="mt-2 flex items-center gap-2 font-semibold">
              {goalHit ? <CheckCircle2 className="size-4.5 text-gain" /> : <TriangleAlert className="size-4.5 text-warn" />}
              {goalHit ? 'Achieved' : 'Missed'}
            </div>
            <div className="num mt-1 text-xs text-dim">
              {fmtMoney(s.netPnl)} of {fmtMoney(workspace.monthlyGoal)}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-ink-2 p-5">
            <div className="text-xs text-muted">Discipline score</div>
            <div className="num mt-2 text-2xl font-semibold">{fmtPct(discipline, 0)}</div>
            <div className="text-xs text-dim">Trades without a rule break</div>
          </div>
          <div className="rounded-2xl border border-line bg-ink-2 p-5">
            <div className="text-xs text-muted">Risk profile</div>
            <div className="num mt-2 text-2xl font-semibold text-loss">{fmtMoney(-s.maxDrawdown)}</div>
            <div className="text-xs text-dim">Max drawdown · avg hold {fmtHold(s.avgHoldMinutes)}</div>
          </div>
        </section>

        {insights.length > 0 && (
          <section>
            <SectionTitle eyebrow="What the numbers say" title="Key insights" />
            <ul className="space-y-2.5">
              {insights.map((i) => (
                <li key={i.text} className="flex gap-3 rounded-xl border border-line bg-ink-2 p-4 text-sm leading-relaxed">
                  <Lightbulb
                    className={cx(
                      'mt-0.5 size-4 shrink-0',
                      i.tone === 'good' ? 'text-gain' : i.tone === 'bad' ? 'text-loss' : 'text-accent',
                    )}
                  />
                  {i.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="grid gap-8 md:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Edge" title="Setups" />
            <BreakdownTable rows={bySetup} />
          </div>
          <div>
            <SectionTitle eyebrow="Exposure" title="Markets" />
            <BreakdownTable rows={byMarket} />
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Timing" title="Day of week" />
            <div className="flex h-40 items-end gap-3">
              {byDay.map((d) => (
                <div key={d.name} className="flex flex-1 flex-col items-center gap-2">
                  <span className={cx('num text-[10px]', pnlClass(d.netPnl))}>
                    {Math.abs(d.netPnl) >= 1000 ? `${(d.netPnl / 1000).toFixed(1)}k` : Math.round(d.netPnl)}
                  </span>
                  <div
                    className={cx('w-full rounded-t-lg', d.netPnl >= 0 ? 'bg-gain/80' : 'bg-loss/80')}
                    style={{ height: `${Math.max(4, (Math.abs(d.netPnl) / maxDay) * 100)}px` }}
                  />
                  <span className="text-xs text-muted">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            <SectionTitle eyebrow="Extremes" title="Best & worst" />
            {[
              { label: 'Best trade', t: s.best },
              { label: 'Worst trade', t: s.worst },
            ].map(({ label, t }) =>
              t ? (
                <div key={label} className="flex items-center justify-between rounded-xl border border-line bg-ink-2 p-4">
                  <div>
                    <div className="text-xs text-dim">{label}</div>
                    <div className="mt-0.5 font-semibold">
                      {t.symbol} <span className="text-sm font-normal text-muted">· {t.setup}</span>
                    </div>
                    <div className="num text-xs text-dim">{fmtDate(t.closedAt)} · {fmtR(t.rMultiple)}</div>
                  </div>
                  <span className={cx('num text-lg font-semibold', pnlClass(t.pnl))}>
                    {fmtMoney(t.pnl, { sign: true })}
                  </span>
                </div>
              ) : null,
            )}
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-xs text-dim">
          <span>
            Avg win {fmtMoney(s.avgWin)} · Avg loss {fmtMoney(s.avgLoss)} · Expectancy {fmtMoney(s.expectancy, { sign: true })} · Fees {fmtMoney(s.fees)}
          </span>
          <span>Generated by Tradify</span>
        </footer>
      </div>
    </article>
  )
}

function Headline({ label, value, cls, delta }: { label: string; value: string; cls?: string; delta: { text: string; up: boolean } | null }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={cx('num mt-1 text-2xl font-semibold sm:text-3xl', cls)}>{value}</div>
      {delta && (
        <div className={cx('num mt-1 text-xs', delta.up ? 'text-gain' : 'text-loss')}>
          {delta.up ? '▲' : '▼'} {delta.text} <span className="text-dim">vs prev.</span>
        </div>
      )}
    </div>
  )
}

function BreakdownTable({ rows }: { rows: ReturnType<typeof groupBy> }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] tracking-wider text-dim uppercase">
          <th className="pb-2 font-semibold">Name</th>
          <th className="pb-2 text-right font-semibold">Trades</th>
          <th className="pb-2 text-right font-semibold">Win %</th>
          <th className="pb-2 text-right font-semibold">Net</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-t border-line/70">
            <td className="py-2.5">{r.name}</td>
            <td className="num py-2.5 text-right text-muted">{r.total}</td>
            <td className="num py-2.5 text-right text-muted">{fmtPct(r.winRate, 0)}</td>
            <td className={cx('num py-2.5 text-right font-semibold', pnlClass(r.netPnl))}>
              {fmtMoney(r.netPnl, { sign: true })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function delta(cur: number | null, prev: number | null, kind: 'money' | 'pts' | 'num' | 'count') {
  if (cur === null || prev === null || (kind !== 'pts' && prev === 0 && cur === 0)) return null
  const d = cur - prev
  const text =
    kind === 'money'
      ? fmtMoney(Math.abs(d))
      : kind === 'pts'
        ? `${Math.abs(d * 100).toFixed(1)} pts`
        : kind === 'num'
          ? Math.abs(d).toFixed(2)
          : String(Math.abs(d))
  return { text, up: d >= 0 }
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
