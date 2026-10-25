import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  Brain,
  CalendarCheck2,
  Link2,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { Sparkline } from '../components/charts'
import { Logo } from '../components/ui'
import { demoTrades, demoWorkspace } from '../lib/fixtures'
import { computeStats, equityCurve, groupBy, previousMonthKey, tradesInMonth } from '../lib/stats'
import { cx, fmtMoney, fmtNum, fmtPct, pnlClass } from '../lib/format'

export const Route = createFileRoute('/')({ component: Landing })

const preview = (() => {
  const curve = equityCurve(demoTrades, demoWorkspace.startingBalance)
  const stats = computeStats(demoTrades, demoWorkspace.startingBalance)
  const month = previousMonthKey('2026-10')
  const monthStats = computeStats(tradesInMonth(demoTrades, month))
  const setups = groupBy(tradesInMonth(demoTrades, month), (t) => t.setup).slice(0, 3)
  return { curve: curve.map((p) => p.equity), stats, monthStats, setups }
})()

const features = [
  {
    icon: Link2,
    title: 'TradingView sync',
    body: 'Connect once and every fill from your TradingView-linked broker lands in your journal — entries, exits, size, and fees.',
  },
  {
    icon: CalendarCheck2,
    title: 'Report on the 1st',
    body: 'A detailed performance review of last month, issued automatically on the first of every month and sent to your inbox.',
  },
  {
    icon: BarChart3,
    title: 'Stats that matter',
    body: 'Win rate, profit factor, expectancy, R-multiples, drawdown and streaks — calculated live across any date range.',
  },
  {
    icon: Brain,
    title: 'Mindset tracking',
    body: 'Tag emotions and rule breaks, then see exactly what FOMO and revenge trades cost you.',
  },
  {
    icon: BookOpenText,
    title: 'A real journal',
    body: 'Notes, ratings, setups and tags on every trade. Search your whole history in a keystroke.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Fully yours',
    body: 'Rename it, recolour it, choose your widgets and fields. Tradify bends to your process, not the other way round.',
  },
]

const tape = ['EURUSD', 'NAS100', 'XAUUSD', 'BTCUSD', 'GBPJPY', 'US30', 'ETHUSD', 'AAPL', 'TSLA', 'ES1!', 'USDJPY', 'SOLUSD']

function Landing() {
  const { stats, monthStats, setups, curve } = preview
  return (
    <div className="relative overflow-x-hidden">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line/50 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="transition hover:text-fg">Features</a>
            <a href="#how" className="transition hover:text-fg">How it works</a>
            <a href="#report" className="transition hover:text-fg">Monthly report</a>
          </nav>
          <Link to="/app" className="btn-primary !py-2">
            Open journal <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="grain relative pt-36 pb-20 sm:pt-44">
        <div className="grid-bg absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent/12 blur-[140px]" />
        <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line-2 bg-panel/70 px-4 py-1.5 text-xs font-medium text-muted animate-rise">
            <Sparkles className="size-3.5 text-accent" /> Your trading journal, synced with TradingView
          </div>
          <h1
            className="mx-auto mt-7 max-w-4xl font-display text-6xl leading-[0.95] tracking-tight animate-rise sm:text-8xl"
            style={{ animationDelay: '80ms' }}
          >
            Every trade, remembered.
            <br />
            <em className="text-accent">Every month, explained.</em>
          </h1>
          <p
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted animate-rise"
            style={{ animationDelay: '160ms' }}
          >
            Tradify copies your trades from TradingView, tracks your win rate and full history, and
            hands you a detailed performance report on the 1st of every month.
          </p>
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-rise"
            style={{ animationDelay: '240ms' }}
          >
            <Link to="/app" className="btn-primary !px-7 !py-3.5 text-base">
              Explore the journal <ArrowRight className="size-4" />
            </Link>
            <Link to="/app/reports" className="btn-ghost !px-7 !py-3.5 text-base">
              See a sample report
            </Link>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto mt-20 max-w-5xl animate-rise" style={{ animationDelay: '360ms' }}>
            <div className="absolute -inset-px rounded-[28px] bg-linear-to-b from-line-2 to-transparent" />
            <div className="relative rounded-[28px] border border-line bg-ink-2/90 p-3 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur">
              <div className="flex items-center gap-1.5 px-3 pb-3 pt-1">
                <span className="size-2.5 rounded-full bg-line-2" />
                <span className="size-2.5 rounded-full bg-line-2" />
                <span className="size-2.5 rounded-full bg-line-2" />
                <span className="ml-3 rounded-full bg-panel px-3 py-0.5 text-[11px] text-dim">tradify.com/app</span>
              </div>
              <div className="grid gap-3 text-left md:grid-cols-[1.6fr_1fr]">
                <div className="rounded-2xl border border-line bg-panel p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-muted">Net P&L · all time</div>
                      <div className="num mt-1 text-3xl font-semibold text-gain">
                        {fmtMoney(stats.netPnl, { sign: true })}
                      </div>
                    </div>
                    <div className="flex gap-4 text-right">
                      <Mini label="Win rate" value={fmtPct(stats.winRate)} />
                      <Mini label="Profit factor" value={fmtNum(stats.profitFactor)} />
                      <Mini label="Trades" value={String(stats.total)} />
                    </div>
                  </div>
                  <Sparkline values={curve} className="mt-6 h-40 w-full" />
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-line bg-panel p-5">
                    <div className="text-xs text-muted">September report</div>
                    <div className={cx('num mt-1 text-2xl font-semibold', pnlClass(monthStats.netPnl))}>
                      {fmtMoney(monthStats.netPnl, { sign: true })}
                    </div>
                    <div className="mt-3 space-y-2">
                      {setups.map((s) => (
                        <div key={s.name} className="flex justify-between text-xs">
                          <span className="text-muted">{s.name}</span>
                          <span className={cx('num', pnlClass(s.netPnl))}>{fmtMoney(s.netPnl, { sign: true })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-5">
                    <span className="size-2.5 rounded-full bg-gain animate-pulse-dot" />
                    <div className="text-sm">
                      <div className="font-semibold">TradingView connected</div>
                      <div className="text-xs text-dim">New fills sync automatically</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker tape */}
      <div className="relative border-y border-line bg-ink-2/60 py-4 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-tape gap-12 pr-12">
          {[...tape, ...tape].map((s, i) => (
            <span key={i} className="num text-sm text-dim">
              {s} <span className={i % 3 === 1 ? 'text-loss' : 'text-gain'}>{i % 3 === 1 ? '▼' : '▲'}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Why Tradify</div>
          <h2 className="mt-4 font-display text-5xl leading-tight tracking-tight sm:text-6xl">
            The journal that does the <em>boring part</em> for you.
          </h2>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="group bg-ink p-8 transition duration-300 hover:bg-panel">
              <div className="grid size-11 place-items-center rounded-xl border border-line-2 bg-panel text-accent transition group-hover:scale-110 group-hover:border-accent/40">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line bg-ink-2/50">
        <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
          <h2 className="font-display text-5xl tracking-tight sm:text-6xl">Three steps. Then just trade.</h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              ['01', 'Connect TradingView', 'Link your account and broker. Past trades import in one go, new ones stream in as they fill.'],
              ['02', 'Journal with intent', 'Add setups, emotions, ratings and notes. Tradify surfaces the patterns behind your results.'],
              ['03', 'Review on the 1st', 'Wake up to a complete monthly report: what worked, what cost you, and what to change.'],
            ].map(([n, t, b]) => (
              <div key={n} className="relative border-t border-line-2 pt-8">
                <span className="num text-sm text-accent">{n}</span>
                <h3 className="mt-3 text-2xl font-semibold">{t}</h3>
                <p className="mt-3 leading-relaxed text-muted">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Report teaser */}
      <section id="report" className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-28 sm:px-8 lg:grid-cols-2">
        <div>
          <div className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Monthly report</div>
          <h2 className="mt-4 font-display text-5xl leading-tight tracking-tight sm:text-6xl">
            Your month, <em>on a single page.</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Headline numbers versus last month, daily P&L, best and worst trades, setup and market
            breakdowns, a discipline score, and plain-English insights — issued automatically on the 1st.
          </p>
          <Link to="/app/reports" className="btn-primary mt-8 !px-6 !py-3">
            Open the September report <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-accent/8 blur-3xl" />
          <div className="relative rotate-[1.5deg] rounded-3xl border border-line bg-panel p-8 shadow-2xl transition duration-500 hover:rotate-0">
            <div className="text-[11px] font-semibold tracking-[0.2em] text-dim uppercase">Issued Oct 1, 2026</div>
            <div className="mt-2 font-display text-5xl">
              September <em className="text-muted">2026</em>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <Mini label="Net P&L" value={fmtMoney(monthStats.netPnl, { sign: true })} cls={pnlClass(monthStats.netPnl)} big />
              <Mini label="Win rate" value={fmtPct(monthStats.winRate)} big />
              <Mini label="Profit factor" value={fmtNum(monthStats.profitFactor)} big />
            </div>
            <div className="mt-8 space-y-2.5">
              {['Strongest edge identified by setup', 'Cost of rule breaks, in dollars', 'Best and worst day of the week'].map((x) => (
                <div key={x} className="flex items-center gap-3 rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-muted">
                  <span className="size-1.5 rounded-full bg-accent" /> {x}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-28 sm:px-8">
        <div className="grain relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-line bg-panel px-8 py-20 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-accent/15 blur-[120px]" />
          <h2 className="relative font-display text-5xl tracking-tight sm:text-7xl">
            Trade with a <em className="text-accent">memory.</em>
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-muted">
            Open the journal and explore a fully populated demo account.
          </p>
          <Link to="/app" className="btn-primary relative mt-10 !px-8 !py-4 text-base">
            Open Tradify <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-dim sm:flex-row sm:px-8">
          <Logo />
          <span>© 2026 tradify.com · Trading involves risk. Past performance is not indicative of future results.</span>
        </div>
      </footer>
    </div>
  )
}

function Mini({ label, value, cls, big }: { label: string; value: string; cls?: string; big?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-dim">{label}</div>
      <div className={cx('num font-semibold', big ? 'mt-1 text-xl' : 'text-sm', cls)}>{value}</div>
    </div>
  )
}
