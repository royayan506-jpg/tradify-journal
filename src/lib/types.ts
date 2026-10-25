export type Side = 'long' | 'short'

export interface Trade {
  id: string
  symbol: string
  market: string
  side: Side
  entry: number
  exit: number
  quantity: number
  openedAt: string
  closedAt: string
  /** Net P&L after fees, in account currency. */
  pnl: number
  fees: number
  rMultiple: number
  setup: string
  tags: string[]
  emotion: string
  /** Execution quality, 1–5. */
  rating: number
  notes: string
  source: 'tradingview' | 'manual'
}

export type WidgetKey = 'equity' | 'calendar' | 'setups' | 'recent' | 'psychology'

export interface Workspace {
  journalName: string
  traderName: string
  startingBalance: number
  currency: string
  accent: string
  riskPerTrade: number
  monthlyGoal: number
  widgets: Record<WidgetKey, boolean>
  customFields: string[]
  /** Day of month the monthly report is issued. */
  reportDay: number
  reportEmail: boolean
}

export interface Connection {
  provider: 'TradingView'
  status: 'connected' | 'disconnected' | 'syncing'
  account: string
  broker: string
  lastSyncAt: string
  importedTrades: number
}
