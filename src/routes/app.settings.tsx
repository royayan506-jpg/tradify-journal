import { createFileRoute } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { Check, Copy, Link2, Plus, RefreshCw, Unplug, X } from 'lucide-react'
import { Sheet, Toggle } from '../components/ui'
import { useJournal } from '../lib/store'
import { cx, fmtDate, fmtTime } from '../lib/format'
import type { WidgetKey } from '../lib/types'

export const Route = createFileRoute('/app/settings')({ component: SettingsPage })

const accents = ['#c6f36b', '#5ee0a0', '#7cc7ff', '#b69cff', '#ff9f6b', '#f5c565', '#ff7eb6']

const widgetLabels: Record<WidgetKey, [string, string]> = {
  equity: ['Equity curve', 'Account growth over the selected range'],
  calendar: ['P&L calendar', 'Heatmap of daily results'],
  setups: ['Setup breakdown', 'Which strategies carry your edge'],
  psychology: ['Mindset vs. results', 'P&L grouped by logged emotion'],
  recent: ['Recent trades', 'Your latest fills at a glance'],
}

function SettingsPage() {
  const { workspace: ws, updateWorkspace, connection, setConnection, syncNow, notify } = useJournal()
  const [newField, setNewField] = useState('')
  const [connectOpen, setConnectOpen] = useState(false)
  const connected = connection.status !== 'disconnected'

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-5xl tracking-tight">Make it yours</h1>
        <p className="mt-1 text-muted">Shape Tradify around how you trade — every change applies instantly.</p>
      </header>

      <Panel title="TradingView" description="Copy every fill from your TradingView-connected broker automatically.">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-ink-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-xl bg-[#131722] text-white">
              <svg viewBox="0 0 36 28" className="w-7" aria-hidden fill="currentColor">
                <path d="M14 22H7V11H0V4h14v18zM28 22h-8l7.5-18h8L28 22z" />
                <circle cx="20" cy="8" r="4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 font-semibold">
                {connected ? `@${connection.account}` : 'Not connected'}
                {connected && <span className="chip bg-gain/12 text-gain">Live</span>}
              </div>
              <div className="text-sm text-muted">
                {connected
                  ? `${connection.broker} · ${connection.importedTrades} trades imported · last sync ${fmtDate(connection.lastSyncAt)} ${fmtTime(connection.lastSyncAt)} UTC`
                  : 'Link your account to start importing trades.'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {connected ? (
              <>
                <button className="btn-ghost !py-2" onClick={syncNow} disabled={connection.status === 'syncing'}>
                  <RefreshCw className={cx('size-4', connection.status === 'syncing' && 'animate-spin')} /> Sync
                </button>
                <button
                  className="btn-ghost !py-2 hover:!border-loss hover:!text-loss"
                  onClick={() => {
                    setConnection({ status: 'disconnected' })
                    notify('TradingView disconnected')
                  }}
                >
                  <Unplug className="size-4" /> Disconnect
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => setConnectOpen(true)}>
                <Link2 className="size-4" /> Connect TradingView
              </button>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Workspace" description="The basics behind every calculation.">
          <div className="grid grid-cols-2 gap-4">
            <TextSetting label="Your name" value={ws.traderName} onChange={(v) => updateWorkspace({ traderName: v })} />
            <TextSetting label="Journal name" value={ws.journalName} onChange={(v) => updateWorkspace({ journalName: v })} />
            <NumSetting label="Starting balance ($)" value={ws.startingBalance} onChange={(v) => updateWorkspace({ startingBalance: v })} />
            <NumSetting label="Monthly goal ($)" value={ws.monthlyGoal} onChange={(v) => updateWorkspace({ monthlyGoal: v })} />
            <NumSetting label="Risk per trade (%)" value={ws.riskPerTrade} step={0.1} onChange={(v) => updateWorkspace({ riskPerTrade: v })} />
            <label className="block">
              <span className="label">Currency</span>
              <select className="field" value={ws.currency} onChange={(e) => updateWorkspace({ currency: e.target.value })}>
                {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </Panel>

        <Panel title="Appearance" description="Pick the accent that feels like you.">
          <div className="flex flex-wrap gap-3">
            {accents.map((c) => (
              <button
                key={c}
                onClick={() => updateWorkspace({ accent: c })}
                aria-label={`Accent ${c}`}
                aria-pressed={ws.accent === c}
                className={cx(
                  'grid size-11 place-items-center rounded-full transition hover:scale-110',
                  ws.accent === c && 'ring-2 ring-fg ring-offset-4 ring-offset-panel',
                )}
                style={{ backgroundColor: c }}
              >
                {ws.accent === c && <Check className="size-4 text-ink" />}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-line bg-ink-2 p-4">
            <div className="text-xs text-dim">Preview</div>
            <div className="mt-2 flex items-center gap-3">
              <button className="btn-primary !py-2">Primary action</button>
              <span className="font-display text-2xl italic text-accent">Every trade, remembered.</span>
            </div>
          </div>
        </Panel>

        <Panel title="Dashboard widgets" description="Show only what helps you decide.">
          <ul className="divide-y divide-line">
            {(Object.keys(widgetLabels) as WidgetKey[]).map((k) => (
              <li key={k} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{widgetLabels[k][0]}</div>
                  <div className="text-xs text-dim">{widgetLabels[k][1]}</div>
                </div>
                <Toggle
                  label={widgetLabels[k][0]}
                  checked={ws.widgets[k]}
                  onChange={(v) => updateWorkspace({ widgets: { ...ws.widgets, [k]: v } })}
                />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Journal fields" description="Track the details that matter to your process.">
          <div className="flex flex-wrap gap-2">
            {ws.customFields.map((f) => (
              <span key={f} className="chip border border-line-2 bg-ink-2 !py-1.5 !pl-3 text-sm text-fg">
                {f}
                <button
                  aria-label={`Remove ${f}`}
                  onClick={() => updateWorkspace({ customFields: ws.customFields.filter((x) => x !== f) })}
                  className="rounded-full p-0.5 text-dim hover:bg-panel-2 hover:text-loss"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const v = newField.trim()
              if (v && !ws.customFields.includes(v)) updateWorkspace({ customFields: [...ws.customFields, v] })
              setNewField('')
            }}
          >
            <input
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              className="field"
              placeholder="e.g. Session, Timeframe, Confluence"
              aria-label="New field name"
            />
            <button className="btn-ghost shrink-0 !rounded-xl">
              <Plus className="size-4" /> Add
            </button>
          </form>

          <div className="mt-8 border-t border-line pt-6">
            <div className="text-sm font-semibold">Monthly report</div>
            <div className="mt-4 grid grid-cols-2 items-end gap-4">
              <label className="block">
                <span className="label">Issue on day</span>
                <select
                  className="field"
                  value={ws.reportDay}
                  onChange={(e) => updateWorkspace({ reportDay: Number(e.target.value) })}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-between rounded-xl border border-line bg-ink-2 px-3.5 py-2.5">
                <span className="text-sm">Email me a copy</span>
                <Toggle label="Email monthly report" checked={ws.reportEmail} onChange={(v) => updateWorkspace({ reportEmail: v })} />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Sheet open={connectOpen} onClose={() => setConnectOpen(false)} title="Connect TradingView" side="center">
        <ConnectFlow
          onDone={() => {
            setConnection({ status: 'connected' })
            setConnectOpen(false)
            notify('TradingView connected')
          }}
        />
      </Sheet>
    </div>
  )
}

function ConnectFlow({ onDone }: { onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const webhook = 'https://tradify.com/api/tradingview/hook/••••••••'
  return (
    <ol className="space-y-5">
      {[
        ['Choose your broker', 'Select the broker you trade through on TradingView — OANDA, Tradovate, Interactive Brokers, and more.'],
        ['Add the Tradify webhook', 'Paste this URL into your TradingView alerts or strategy so every order fill is sent to your journal.'],
        ['Import your history', 'Upload the order history CSV from TradingView’s trading panel to backfill past trades.'],
      ].map(([title, body], i) => (
        <li key={title} className="flex gap-4">
          <span className="num grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-ink">
            {i + 1}
          </span>
          <div className="flex-1">
            <div className="font-semibold">{title}</div>
            <p className="mt-1 text-sm text-muted">{body}</p>
            {i === 1 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-ink p-2 pl-3">
                <code className="num flex-1 truncate text-xs text-muted">{webhook}</code>
                <button
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                  onClick={() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
      <li className="flex justify-end pt-2">
        <button className="btn-primary" onClick={onDone}>
          Finish setup
        </button>
      </li>
    </ol>
  )
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="card p-6 animate-rise">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-5 text-sm text-muted">{description}</p>
      {children}
    </section>
  )
}

function TextSetting({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function NumSetting({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        step={step}
        className="field num"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  )
}
