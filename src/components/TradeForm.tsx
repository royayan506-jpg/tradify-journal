import { useState, type FormEvent } from 'react'
import { emotions, setups } from '../lib/fixtures'
import { cx } from '../lib/format'
import type { Side, Trade } from '../lib/types'

const markets = ['Forex', 'Indices', 'Crypto', 'Commodities', 'Stocks', 'Futures']

type Draft = Omit<Trade, 'id'>

export function TradeForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Trade
  onSubmit: (t: Draft) => void
  onCancel: () => void
}) {
  const [side, setSide] = useState<Side>(initial?.side ?? 'long')
  const [error, setError] = useState<string | null>(null)

  const handle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '').trim()
    const entry = Number(get('entry'))
    const exit = Number(get('exit'))
    const quantity = Number(get('quantity'))
    const fees = Number(get('fees') || 0)
    const risk = Number(get('risk') || 0)
    const symbol = get('symbol').toUpperCase()
    if (!symbol || !entry || !exit || !quantity) {
      setError('Symbol, entry, exit and size are required.')
      return
    }
    const gross = (side === 'long' ? exit - entry : entry - exit) * quantity
    const pnl = Math.round((gross - fees) * 100) / 100
    const opened = get('openedAt') || new Date().toISOString().slice(0, 16)
    const closed = get('closedAt') || opened
    onSubmit({
      symbol,
      market: get('market'),
      side,
      entry,
      exit,
      quantity,
      fees,
      pnl,
      rMultiple: risk > 0 ? Math.round((pnl / risk) * 100) / 100 : 0,
      openedAt: new Date(`${opened}Z`).toISOString(),
      closedAt: new Date(`${closed}Z`).toISOString(),
      setup: get('setup'),
      emotion: get('emotion'),
      rating: Number(get('rating') || 3),
      tags: get('tags')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notes: get('notes'),
      source: initial?.source ?? 'manual',
    })
  }

  const local = (iso?: string) => (iso ? iso.slice(0, 16) : '')

  return (
    <form onSubmit={handle} className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-ink p-1">
        {(['long', 'short'] as const).map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setSide(s)}
            className={cx(
              'rounded-full py-2 text-sm font-semibold capitalize transition',
              side === s
                ? s === 'long'
                  ? 'bg-gain text-ink'
                  : 'bg-loss text-ink'
                : 'text-muted hover:text-fg',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Symbol">
          <input name="symbol" className="field uppercase" placeholder="EURUSD" defaultValue={initial?.symbol} />
        </Field>
        <Field label="Market">
          <select name="market" className="field" defaultValue={initial?.market ?? 'Forex'}>
            {markets.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Entry price">
          <input name="entry" type="number" step="any" className="field num" defaultValue={initial?.entry} />
        </Field>
        <Field label="Exit price">
          <input name="exit" type="number" step="any" className="field num" defaultValue={initial?.exit} />
        </Field>
        <Field label="Size / quantity">
          <input name="quantity" type="number" step="any" className="field num" defaultValue={initial?.quantity} />
        </Field>
        <Field label="Fees">
          <input name="fees" type="number" step="any" className="field num" defaultValue={initial?.fees ?? 0} />
        </Field>
        <Field label="Opened (UTC)">
          <input name="openedAt" type="datetime-local" className="field num" defaultValue={local(initial?.openedAt)} />
        </Field>
        <Field label="Closed (UTC)">
          <input name="closedAt" type="datetime-local" className="field num" defaultValue={local(initial?.closedAt)} />
        </Field>
        <Field label="Planned risk ($)">
          <input name="risk" type="number" step="any" className="field num" placeholder="250" />
        </Field>
        <Field label="Execution rating">
          <select name="rating" className="field" defaultValue={initial?.rating ?? 3}>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {'★'.repeat(r)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Setup">
          <select name="setup" className="field" defaultValue={initial?.setup ?? setups[0]}>
            {setups.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Emotion">
          <select name="emotion" className="field" defaultValue={initial?.emotion ?? 'Calm'}>
            {emotions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Tags (comma separated)">
        <input name="tags" className="field" placeholder="A+ setup, Scaled out" defaultValue={initial?.tags.join(', ')} />
      </Field>
      <Field label="Notes">
        <textarea
          name="notes"
          rows={4}
          className="field resize-none"
          placeholder="What did you see? What would you do differently?"
          defaultValue={initial?.notes}
        />
      </Field>
      {error && <p className="text-sm text-loss">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary">{initial ? 'Save changes' : 'Log trade'}</button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}
