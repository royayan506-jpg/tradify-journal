/**
 * Demo data for Tradify's product surface.
 *
 * Everything the UI shows comes from this module. A later milestone replaces
 * `demoTrades` / `demoWorkspace` / `demoConnection` with Netlify Database
 * queries and TradingView-synced records — keep the shapes in `types.ts`.
 */
import type { Connection, Trade, Workspace } from './types'

// Deterministic PRNG so SSR and client render the same numbers.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const instruments = [
  { symbol: 'EURUSD', market: 'Forex', price: 1.085, tick: 0.0001, qty: 100000, weight: 4 },
  { symbol: 'GBPJPY', market: 'Forex', price: 191.4, tick: 0.01, qty: 50000, weight: 2 },
  { symbol: 'XAUUSD', market: 'Commodities', price: 2410, tick: 0.1, qty: 10, weight: 3 },
  { symbol: 'NAS100', market: 'Indices', price: 19850, tick: 1, qty: 2, weight: 4 },
  { symbol: 'US30', market: 'Indices', price: 41200, tick: 1, qty: 1, weight: 2 },
  { symbol: 'BTCUSD', market: 'Crypto', price: 64200, tick: 1, qty: 0.15, weight: 3 },
  { symbol: 'ETHUSD', market: 'Crypto', price: 3150, tick: 0.1, qty: 2, weight: 2 },
  { symbol: 'AAPL', market: 'Stocks', price: 226, tick: 0.01, qty: 60, weight: 1 },
  { symbol: 'TSLA', market: 'Stocks', price: 238, tick: 0.01, qty: 40, weight: 1 },
] as const

export const setups = [
  'London Breakout',
  'VWAP Reclaim',
  'Liquidity Sweep',
  'Trend Pullback',
  'Range Fade',
  'News Momentum',
] as const

const setupEdge: Record<string, number> = {
  'London Breakout': 0.6,
  'VWAP Reclaim': 0.62,
  'Liquidity Sweep': 0.57,
  'Trend Pullback': 0.55,
  'Range Fade': 0.44,
  'News Momentum': 0.4,
}

export const emotions = ['Calm', 'Confident', 'Hesitant', 'FOMO', 'Revenge', 'Tired'] as const

const noteBank = {
  win: [
    'Waited for the retest, entry was clean. Scaled out at 1R and let the runner go.',
    'Plan executed exactly. Stop under structure, target at prior day high.',
    'Patience paid off — skipped the first signal and took the confirmation.',
    'Strong momentum after the open; trailed stop behind 5m swing lows.',
  ],
  loss: [
    'Entered early before confirmation. Stop was fine, timing was not.',
    'News spike took me out. Should have flattened before the release.',
    'Moved stop once — need to respect the original invalidation.',
    'Chop day. Two attempts max next time, this was the third.',
  ],
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]
}

function weightedInstrument(rand: () => number) {
  const total = instruments.reduce((s, i) => s + i.weight, 0)
  let r = rand() * total
  for (const inst of instruments) {
    r -= inst.weight
    if (r <= 0) return inst
  }
  return instruments[0]
}

function generateTrades(): Trade[] {
  const rand = mulberry32(20260501)
  const trades: Trade[] = []
  const start = Date.UTC(2026, 4, 1) // May 1, 2026
  const end = Date.UTC(2026, 9, 24) // Oct 24, 2026
  let n = 0

  for (let day = start; day <= end; day += 86400000) {
    const dow = new Date(day).getUTCDay()
    if (dow === 0 || dow === 6) continue
    const count = rand() < 0.15 ? 0 : 1 + Math.floor(rand() * 2.4)

    for (let k = 0; k < count; k++) {
      const inst = weightedInstrument(rand)
      const setup = pick(rand, setups)
      const side = rand() < 0.58 ? 'long' : 'short'
      const win = rand() < setupEdge[setup]
      const riskUsd = 180 + Math.round(rand() * 220)
      const r = win ? 0.6 + rand() * 2.6 : -(0.35 + rand() * 0.75)
      const fees = Math.round((3 + rand() * 9) * 100) / 100
      const pnl = Math.round((riskUsd * r - fees) * 100) / 100

      const drift = 1 + (rand() - 0.5) * 0.08
      const entry = +(inst.price * drift).toFixed(inst.tick < 0.01 ? 5 : 2)
      const move = pnl / inst.qty
      const exit = +(side === 'long' ? entry + move : entry - move).toFixed(
        inst.tick < 0.01 ? 5 : 2,
      )

      const openMinutes = 7 * 60 + Math.floor(rand() * 9 * 60)
      const holdMinutes = 4 + Math.floor(rand() * 220)
      const openedAt = new Date(day + openMinutes * 60000).toISOString()
      const closedAt = new Date(day + (openMinutes + holdMinutes) * 60000).toISOString()

      const emotion = win
        ? pick(rand, ['Calm', 'Confident', 'Calm', 'Hesitant'] as const)
        : pick(rand, ['Hesitant', 'FOMO', 'Revenge', 'Tired', 'Calm'] as const)

      n++
      trades.push({
        id: `t_${String(n).padStart(4, '0')}`,
        symbol: inst.symbol,
        market: inst.market,
        side,
        entry,
        exit,
        quantity: inst.qty,
        openedAt,
        closedAt,
        pnl,
        fees,
        rMultiple: Math.round(r * 100) / 100,
        setup,
        tags: [
          ...(rand() < 0.3 ? ['A+ setup'] : []),
          ...(rand() < 0.2 ? ['Scaled out'] : []),
          ...(!win && rand() < 0.35 ? ['Rule break'] : []),
        ],
        emotion,
        rating: win ? 3 + Math.floor(rand() * 3) : 1 + Math.floor(rand() * 3),
        notes: pick(rand, win ? noteBank.win : noteBank.loss),
        source: rand() < 0.82 ? 'tradingview' : 'manual',
      })
    }
  }
  return trades.sort((a, b) => b.closedAt.localeCompare(a.closedAt))
}

export const demoTrades: Trade[] = generateTrades()

export const demoWorkspace: Workspace = {
  journalName: 'Tradify',
  traderName: 'Alex Morgan',
  startingBalance: 25000,
  currency: 'USD',
  accent: '#c6f36b',
  riskPerTrade: 1,
  monthlyGoal: 3000,
  widgets: {
    equity: true,
    calendar: true,
    setups: true,
    recent: true,
    psychology: true,
  },
  customFields: ['Setup', 'Emotion', 'Rating', 'Tags'],
  reportDay: 1,
  reportEmail: true,
}

export const demoConnection: Connection = {
  provider: 'TradingView',
  status: 'connected',
  account: 'alexmorgan_fx',
  broker: 'OANDA via TradingView',
  lastSyncAt: '2026-10-24T20:42:00.000Z',
  importedTrades: demoTrades.filter((t) => t.source === 'tradingview').length,
}

/** "Now" for the demo, so the UI is stable regardless of the real clock. */
export const demoNow = new Date('2026-10-25T09:00:00.000Z')
