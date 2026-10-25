import { describe, expect, it } from 'vitest'
import { demoTrades } from './fixtures'
import { computeStats, previousMonthKey } from './stats'
import type { Trade } from './types'

const t = (pnl: number, closedAt: string): Trade => ({
  ...demoTrades[0],
  pnl,
  rMultiple: pnl / 100,
  closedAt,
  openedAt: closedAt,
})

describe('computeStats', () => {
  it('calculates win rate, profit factor and drawdown', () => {
    const s = computeStats(
      [t(200, '2026-01-01T10:00:00Z'), t(-100, '2026-01-02T10:00:00Z'), t(-50, '2026-01-03T10:00:00Z'), t(300, '2026-01-04T10:00:00Z')],
      1000,
    )
    expect(s.winRate).toBe(0.5)
    expect(s.netPnl).toBe(350)
    expect(s.profitFactor).toBeCloseTo(500 / 150)
    expect(s.maxDrawdown).toBe(150)
    expect(s.longestLossStreak).toBe(2)
  })

  it('returns nulls for an empty list', () => {
    const s = computeStats([])
    expect(s.winRate).toBeNull()
    expect(s.profitFactor).toBeNull()
  })
})

it('steps back across a year boundary', () => {
  expect(previousMonthKey('2026-01')).toBe('2025-12')
})
