import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useState, type CSSProperties } from 'react'
import { BookOpen, FileBarChart2, LayoutDashboard, Menu, RefreshCw, Settings2, X } from 'lucide-react'
import { Logo } from '../components/ui'
import { JournalProvider, useJournal } from '../lib/store'
import { cx } from '../lib/format'

export const Route = createFileRoute('/app')({ component: AppLayout })

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/app/journal', label: 'Journal', icon: BookOpen, exact: false },
  { to: '/app/reports', label: 'Monthly reports', icon: FileBarChart2, exact: false },
  { to: '/app/settings', label: 'Customize', icon: Settings2, exact: false },
] as const

function AppLayout() {
  return (
    <JournalProvider>
      <Shell />
    </JournalProvider>
  )
}

function Shell() {
  const { workspace, connection, syncNow, toast } = useJournal()
  const [open, setOpen] = useState(false)
  const syncing = connection.status === 'syncing'

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="px-2">
        <Logo />
      </Link>
      <div className="mt-1 truncate px-2 text-xs text-dim">{workspace.traderName}'s journal</div>

      <nav className="mt-8 space-y-1">
        {nav.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact }}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-panel hover:text-fg data-[status=active]:bg-panel data-[status=active]:text-fg"
          >
            {({ isActive }) => (
              <>
                <Icon className={cx('size-4.5 transition', isActive ? 'text-accent' : 'text-dim group-hover:text-fg')} />
                {label}
              </>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-auto card p-4">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className={cx(
              'size-2 rounded-full',
              connection.status === 'disconnected' ? 'bg-dim' : 'bg-gain animate-pulse-dot',
            )}
          />
          TradingView {connection.status === 'disconnected' ? 'not connected' : 'connected'}
        </div>
        <div className="mt-1 truncate text-xs text-dim">@{connection.account}</div>
        <button
          onClick={syncNow}
          disabled={syncing || connection.status === 'disconnected'}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line-2 py-2 text-xs font-semibold text-muted transition hover:border-dim hover:text-fg disabled:opacity-50"
        >
          <RefreshCw className={cx('size-3.5', syncing && 'animate-spin')} />
          {syncing ? 'Syncing fills…' : 'Sync now'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ '--color-accent': workspace.accent } as CSSProperties}>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-ink-2/60 p-5 lg:block">
        {sidebar}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ink/80 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-full p-2 hover:bg-panel">
          <Menu className="size-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-line bg-ink-2 p-5 animate-fade">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-4 top-5 rounded-full p-1.5 hover:bg-panel">
              <X className="size-4" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
          <Outlet />
        </div>
      </main>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-line-2 bg-panel-2 px-5 py-2.5 text-sm font-medium shadow-2xl animate-rise"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
