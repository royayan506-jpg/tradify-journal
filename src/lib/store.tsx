import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { demoConnection, demoNow, demoTrades, demoWorkspace } from './fixtures'
import type { Connection, Trade, Workspace } from './types'

/**
 * Client-side journal store for the product surface.
 * Milestone 2 swaps these in-memory actions for server functions backed by
 * Netlify Database; the component API stays the same.
 */
interface JournalStore {
  trades: Trade[]
  workspace: Workspace
  connection: Connection
  now: Date
  toast: string | null
  addTrade: (t: Omit<Trade, 'id'>) => void
  updateTrade: (id: string, patch: Partial<Trade>) => void
  deleteTrade: (id: string) => void
  updateWorkspace: (patch: Partial<Workspace>) => void
  setConnection: (patch: Partial<Connection>) => void
  syncNow: () => void
  notify: (msg: string) => void
}

const Ctx = createContext<JournalStore | null>(null)

export function JournalProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState(demoTrades)
  const [workspace, setWorkspace] = useState(demoWorkspace)
  const [connection, setConn] = useState(demoConnection)
  const [toast, setToast] = useState<string | null>(null)

  const notify = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600)
  }, [])

  const value = useMemo<JournalStore>(
    () => ({
      trades,
      workspace,
      connection,
      now: demoNow,
      toast,
      notify,
      addTrade: (t) => {
        setTrades((list) =>
          [{ ...t, id: `t_${Date.now().toString(36)}` }, ...list].sort((a, b) =>
            b.closedAt.localeCompare(a.closedAt),
          ),
        )
        notify('Trade logged')
      },
      updateTrade: (id, patch) =>
        setTrades((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      deleteTrade: (id) => {
        setTrades((list) => list.filter((t) => t.id !== id))
        notify('Trade removed')
      },
      updateWorkspace: (patch) => setWorkspace((w) => ({ ...w, ...patch })),
      setConnection: (patch) => setConn((c) => ({ ...c, ...patch })),
      syncNow: () => {
        setConn((c) => ({ ...c, status: 'syncing' }))
        window.setTimeout(() => {
          setConn((c) => ({ ...c, status: 'connected', lastSyncAt: new Date().toISOString() }))
          notify('TradingView is up to date — no new fills')
        }, 1600)
      },
    }),
    [trades, workspace, connection, toast, notify],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useJournal() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useJournal must be used inside <JournalProvider>')
  return ctx
}
