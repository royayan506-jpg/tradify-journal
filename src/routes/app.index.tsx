import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Gauge,
  Percent,
  Scale,
  Target,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { EquityChart } from '../components/charts'
import { PnlCalendar } from '../components/PnlCalendar'
import { SectionTitle, Segmented, SideChip, StatTile } from '../components/ui'
import { useJournal } from '../lib/store'
import { computeStats, equityCurve, groupBy, monthKey } from '../lib/stats'
import { cx, fmtDate, fmtMoney, fmtMonth, fmtNum, fmtPct, fmtR, pnlClass } from '../lib/format'

export const Route = createFileRoute('/app/')({ component: DashboardPage })

type Range = '30d' | '90d' | 'ytd' | 'all'

function DashboardPage() {
  const { trades, workspace, now } = useJournal()
  const [range, setRange] = useState<Range>('90d')

  const cutoff =
    range === 'all'
      ? 0
      : range === 'ytd'
        ? Date.UTC(now.getUTCFullYear(), 0, 1)
        : now.getTime() - (range === '30d' ? 30 : 90) * 86400000
  const filtered = useMemo(
    () => trades.filter((t) => Date.parse(t.closedAt) >= cutoff),
    [trades, cutoff],
  )
  // Realised P&L before the window, so the equity curve starts at the true balance.
  const before = useMemo(
    () => trades.filter((t) => Date.parse(t.closedAt) < cutoff).reduce((s, t) => s + t.pnl, 0),
    [trades, cutoff],
  )
  const startBal = workspace.startingBalance + before
  const stats = useMemo(() => computeStats(filtered, startBal), [filtered, startBal])
  const curve = useMemo(() => equityCurve(filtered, startBal), [filtered, startBal])
  const bySetup = useMemo(() => groupBy(filtered, (t) => t.setup), [filtered])
  const byEmotion = useMemo(() => groupBy(filtered, (t) => t.emotion), [filtered])

  const thisMonth = monthKey(now.toISOString())
  const monthPnl = trades
    .filter((t) => monthKey(t.closedAt) === thisMonth)
    .reduce((s, t) => s + t.pnl, 0)
  const goalPct = workspace.monthlyGoal > 0 ? Math.max(0, Math.min(1, monthPnl / workspace.monthlyGoal)) : 0
  const balance = workspace.startingBalance + trades.reduce((s, t) => s + t.pnl, 0)
  const maxSetup = Math.max(1, ...bySetup.map((s) => Math.abs(s.netPnl)))
  const nextReport = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, workspace.reportDay))
  const w = workspace.widgets

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="animate-rise">
          <p className="text-sm text-muted">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </p>
          <h1 className="mt-1 font-display text-5xl leading-[1.05] tracking-tight">
            Good morning, <em className="text-accent">{workspace.traderName.split(' ')[0]}</em>
          </h1>
          <p className="mt-2 text-muted">
            Account balance <span className="num font-semibold text-fg">{fmtMoney(balance)}</span>
          </p>
        </div>
        <Segmented
          label="Date range"
          value={range}
          onChange={setRange}
          options={[
            { value: '30d', label: '30D' },
            { value: '90d', label: '90D' },
            { value: 'ytd', label: 'YTD' },
            { value: 'all', label: 'All' },
          ]}
        />
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Net P&L"
          value={fmtMoney(stats.netPnl, { sign: true })}
          tone={stats.netPnl >= 0 ? 'gain' : 'loss'}
          icon={<Wallet className="size-4" />}
          hint={`${stats.total} trades`}
        />
        <StatTile
          label="Win rate"
          value={fmtPct(stats.winRate)}
          icon={<Percent className="size-4" />}
          hint={`${stats.wins}W · ${stats.losses}L`}
          delay={60}
        />
        <StatTile
          label="Profit factor"
          value={fmtNum(stats.profitFactor)}
          icon={<Scale className="size-4" />}
          hint="Gross win ÷ gross loss"
          delay={120}
        />
        <StatTile
          label="Expectancy"
          value={fmtMoney(stats.expectancy, { sign: true })}
          tone={(stats.expectancy ?? 0) >= 0 ? 'gain' : 'loss'}
          icon={<Gauge className="size-4" />}
          hint="Per trade"
          delay={180}
        />
        <StatTile
          label="Avg R"
          value={fmtR(stats.avgR)}
          icon={<Activity className="size-4" />}
          hint={`Best streak ${stats.longestWinStreak}W`}
          delay={240}
        />
        <StatTile
          label="Max drawdown"
          value={fmtMoney(-stats.maxDrawdown)}
          tone="loss"
          icon={<TrendingDown className="size-4" />}
          hint={fmtPct(stats.maxDrawdownPct)}
          delay={300}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {w.equity && (
          <div className={cx('card p-6 animate-rise', w.calendar ? 'lg:col-span-2' : 'lg:col-span-3')}>
            <SectionTitle
              eyebrow="Performance"
              title="Equity curve"
              action={
                <span className={cx('num text-sm font-semibold', pnlClass(stats.netPnl))}>
                  {fmtPct(startBal ? stats.netPnl / startBal : null)}
                </span>
              }
            />
            <EquityChart points={curve} accent={workspace.accent} />
          </div>
        )}
        {w.calendar && (
          <div className="card p-6 animate-rise" style={{ animationDelay: '80ms' }}>
            <SectionTitle eyebrow="Daily" title="P&L calendar" />
            <PnlCalendar trades={trades} initialMonth={thisMonth} />
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/10 blur-3xl" />
          <SectionTitle eyebrow={fmtMonth(thisMonth)} title="Monthly goal" />
          <div className="num text-3xl font-semibold">
            <span className={pnlClass(monthPnl)}>{fmtMoney(monthPnl, { sign: true })}</span>
            <span className="text-base text-dim"> / {fmtMoney(workspace.monthlyGoal)}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel-2">
            <div
              className="h-full rounded-full bg-accent transition-all duration-1000"
              style={{ width: `${goalPct * 100}%` }}
            />
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-ink-2 p-4">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-accent" />
            <div className="text-sm">
              <div className="font-semibold">
                {fmtMonth(thisMonth, 'long').split(' ')[0]} report issues{' '}
                {fmtDate(nextReport.toISOString(), { weekday: 'short' })}
              </div>
              <Link to="/app/reports" className="mt-1 inline-flex items-center gap-1 text-muted hover:text-accent">
                Read last month's report <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {w.setups && (
          <div className="card p-6">
            <SectionTitle eyebrow="Edge" title="By setup" />
            <ul className="space-y-3.5">
              {bySetup.map((s) => (
                <li key={s.name}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className={cx('num text-xs font-semibold', pnlClass(s.netPnl))}>
                      {fmtMoney(s.netPnl, { sign: true })}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
                      <div
                        className={cx('h-full rounded-full', s.netPnl >= 0 ? 'bg-gain' : 'bg-loss')}
                        style={{ width: `${(Math.abs(s.netPnl) / maxSetup) * 100}%` }}
                      />
                    </div>
                    <span className="num w-10 text-right text-[11px] text-dim">{fmtPct(s.winRate, 0)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {w.psychology && (
          <div className="card p-6">
            <SectionTitle eyebrow="Psychology" title="Mindset vs. results" />
            <div className="grid grid-cols-2 gap-2.5">
              {byEmotion.map((e) => (
                <div key={e.name} className="rounded-xl border border-line bg-ink-2 p-3">
                  <div className="text-xs text-muted">{e.name}</div>
                  <div className={cx('num mt-1 text-base font-semibold', pnlClass(e.netPnl))}>
                    {fmtMoney(e.netPnl, { sign: true })}
                  </div>
                  <div className="num text-[11px] text-dim">
                    {fmtPct(e.winRate, 0)} · {e.total} trades
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {w.recent && (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-2">
            <SectionTitle eyebrow="Latest" title="Recent trades" />
            <Link to="/app/journal" className="btn-ghost !py-1.5 text-xs">
              Open journal <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wider text-dim uppercase">
                  <th className="px-6 py-3 font-semibold">Symbol</th>
                  <th className="py-3 font-semibold">Side</th>
                  <th className="py-3 font-semibold">Setup</th>
                  <th className="py-3 font-semibold">Closed</th>
                  <th className="py-3 text-right font-semibold">R</th>
                  <th className="px-6 py-3 text-right font-semibold">P&L</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 6).map((t) => (
                  <tr key={t.id} className="border-t border-line/70 transition hover:bg-panel-2/50">
                    <td className="px-6 py-3.5 font-semibold">{t.symbol}</td>
                    <td className="py-3.5">
                      <SideChip side={t.side} />
                    </td>
                    <td className="py-3.5 text-muted">{t.setup}</td>
                    <td className="num py-3.5 text-xs text-muted">{fmtDate(t.closedAt)}</td>
                    <td className={cx('num py-3.5 text-right', pnlClass(t.rMultiple))}>{fmtR(t.rMultiple)}</td>
                    <td className={cx('num px-6 py-3.5 text-right font-semibold', pnlClass(t.pnl))}>
                      {fmtMoney(t.pnl, { sign: true, cents: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="flex items-center gap-2 text-xs text-dim">
        <Target className="size-3.5" /> Showing demo trades — your synced TradingView history will appear here.
      </p>
    </div>
  )
}
