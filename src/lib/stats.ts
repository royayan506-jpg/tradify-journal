import type { Trade } from './types'

export interface Stats {
  total: number
  wins: number
  losses: number
  winRate: number | null
  netPnl: number
  grossProfit: number
  grossLoss: number
  profitFactor: number | null
  expectancy: number | null
  avgWin: number | null
  avgLoss: number | null
  avgR: number | null
  best: Trade | null
  worst: Trade | null
  maxDrawdown: number
  maxDrawdownPct: number | null
  longestWinStreak: number
  longestLossStreak: number
  fees: number
  avgHoldMinutes: number | null
}

const chrono = (trades: Trade[]) =>
  [...trades].sort((a, b) => a.closedAt.localeCompare(b.closedAt))

export function computeStats(trades: Trade[], startingBalance = 0): Stats {
  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl <= 0)
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const netPnl = grossProfit - grossLoss

  let peak = startingBalance
  let equity = startingBalance
  let maxDrawdown = 0
  let maxDrawdownPct = 0
  let streak = 0
  let longestWinStreak = 0
  let longestLossStreak = 0
  for (const t of chrono(trades)) {
    equity += t.pnl
    peak = Math.max(peak, equity)
    const dd = peak - equity
    if (dd > maxDrawdown) {
      maxDrawdown = dd
      maxDrawdownPct = peak > 0 ? dd / peak : 0
    }
    if (t.pnl > 0) {
      streak = streak > 0 ? streak + 1 : 1
      longestWinStreak = Math.max(longestWinStreak, streak)
    } else {
      streak = streak < 0 ? streak - 1 : -1
      longestLossStreak = Math.max(longestLossStreak, -streak)
    }
  }

  const holds = trades.map(
    (t) => (Date.parse(t.closedAt) - Date.parse(t.openedAt)) / 60000,
  )

  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length ? wins.length / trades.length : null,
    netPnl,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    expectancy: trades.length ? netPnl / trades.length : null,
    avgWin: wins.length ? grossProfit / wins.length : null,
    avgLoss: losses.length ? -grossLoss / losses.length : null,
    avgR: trades.length
      ? trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length
      : null,
    best: trades.reduce<Trade | null>((b, t) => (!b || t.pnl > b.pnl ? t : b), null),
    worst: trades.reduce<Trade | null>((w, t) => (!w || t.pnl < w.pnl ? t : w), null),
    maxDrawdown,
    maxDrawdownPct: trades.length ? maxDrawdownPct : null,
    longestWinStreak,
    longestLossStreak,
    fees: trades.reduce((s, t) => s + t.fees, 0),
    avgHoldMinutes: holds.length
      ? holds.reduce((s, h) => s + h, 0) / holds.length
      : null,
  }
}

export function equityCurve(trades: Trade[], startingBalance: number) {
  const byDay = dailyPnl(trades)
  let equity = startingBalance
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, pnl]) => {
      equity += pnl
      return { day, equity, pnl }
    })
}

/** Map of YYYY-MM-DD → net P&L for that day. */
export function dailyPnl(trades: Trade[]) {
  const map = new Map<string, number>()
  for (const t of trades) {
    const day = t.closedAt.slice(0, 10)
    map.set(day, (map.get(day) ?? 0) + t.pnl)
  }
  return map
}

export function groupBy(trades: Trade[], key: (t: Trade) => string) {
  const groups = new Map<string, Trade[]>()
  for (const t of trades) {
    const k = key(t)
    groups.set(k, [...(groups.get(k) ?? []), t])
  }
  return [...groups.entries()]
    .map(([name, list]) => ({ name, ...computeStats(list) }))
    .sort((a, b) => b.netPnl - a.netPnl)
}

export const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function monthKey(iso: string) {
  return iso.slice(0, 7)
}

export function tradesInMonth(trades: Trade[], key: string) {
  return trades.filter((t) => monthKey(t.closedAt) === key)
}

export function previousMonthKey(key: string) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 2, 1))
  return d.toISOString().slice(0, 7)
}

/** Rule-based observations used by the monthly report until AI summaries ship. */
export function insightsFor(trades: Trade[], prev: Trade[]) {
  const s = computeStats(trades)
  const p = computeStats(prev)
  const out: { tone: 'good' | 'bad' | 'neutral'; text: string }[] = []
  if (!s.total) return out

  const setups = groupBy(trades, (t) => t.setup)
  const top = setups[0]
  const bottom = setups.at(-1)
  if (top && top.netPnl > 0)
    out.push({
      tone: 'good',
      text: `${top.name} was your strongest edge — ${top.total} trades, ${pct(top.winRate)} win rate, ${money(top.netPnl)} net.`,
    })
  if (bottom && bottom !== top && bottom.netPnl < 0)
    out.push({
      tone: 'bad',
      text: `${bottom.name} cost you ${money(Math.abs(bottom.netPnl))}. Consider reducing size or pausing it next month.`,
    })

  const ruleBreaks = trades.filter((t) => t.tags.includes('Rule break'))
  if (ruleBreaks.length) {
    const cost = ruleBreaks.reduce((sum, t) => sum + t.pnl, 0)
    out.push({
      tone: 'bad',
      text: `${ruleBreaks.length} trades were tagged "Rule break", totalling ${money(cost)}. Discipline alone would have changed your month.`,
    })
  }

  const emotional = trades.filter((t) => ['FOMO', 'Revenge'].includes(t.emotion))
  if (emotional.length >= 2) {
    const es = computeStats(emotional)
    out.push({
      tone: 'neutral',
      text: `Trades logged as FOMO or Revenge won ${pct(es.winRate)} of the time vs ${pct(s.winRate)} overall.`,
    })
  }

  if (p.total && s.winRate !== null && p.winRate !== null) {
    const diff = s.winRate - p.winRate
    out.push({
      tone: diff >= 0 ? 'good' : 'bad',
      text: `Win rate ${diff >= 0 ? 'improved' : 'slipped'} ${Math.abs(diff * 100).toFixed(1)} pts versus the previous month.`,
    })
  }

  const days = groupBy(trades, (t) => weekdays[new Date(t.closedAt).getUTCDay()])
  if (days.length > 1) {
    out.push({
      tone: 'neutral',
      text: `${days[0].name} was your best day of the week; ${days.at(-1)!.name} was the weakest.`,
    })
  }
  return out
}

const money = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v)
const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(0)}%`)
