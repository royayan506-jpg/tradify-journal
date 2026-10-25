# Tradify roadmap

Tradify is a customizable trading journal at tradify.com. It syncs trades from TradingView, tracks your full history and key stats, and issues a detailed performance report on the 1st of every month. The work is split into small milestones, each one something you can ship on its own.

## Milestone 1: Product surface ✅
- A branded landing page at `/`.
- An app shell with four screens: Dashboard, Journal, Monthly reports and Customize.
- Live stats (win rate, profit factor, expectancy, avg R, drawdown, streaks), an equity curve, a P&L calendar, a setup breakdown and a mindset breakdown.
- Journal: search, filters, sorting, trade detail, and log/edit/delete.
- Monthly report document with comparisons to the previous month, charts, breakdowns and rule-based insights.
- Customize: workspace values, accent colour, dashboard widgets, journal fields, report day, and a mock TradingView connect flow.
- All data is demo data from `src/lib/fixtures.ts`, held in memory by `src/lib/store.tsx`.

## Milestone 2: Accounts & persistence
- Sign-up and login with Netlify Identity. Protect `/app/*`.
- Netlify Database (Drizzle) tables: `trades`, `workspaces` (settings, widgets, custom fields), `connections` and `reports`.
- Move the `useJournal` actions over to server functions while keeping the same component API. Delete the fixtures, or use them as a "demo account" seed.
- Store custom field values on each trade as JSONB.

## Milestone 3: TradingView sync
TradingView has no public API for trade history, so the sync combines three paths:
1. **Webhook ingest.** Each user gets a unique, secret webhook URL (a Netlify Function). Pine strategy or alert messages send fills as JSON. The function validates them, removes duplicates by order ID, and pairs entries with exits to build trades.
2. **CSV import.** Parse the order/position history export from TradingView's trading panel to backfill past trades, with a column-mapping preview.
3. **Broker APIs (optional).** Direct sync for brokers that TradingView connects to and that expose APIs (e.g. OANDA, Tradovate, IBKR), run on a scheduled function.
- Show sync status, last sync time and an import log in Customize.

## Milestone 4: Monthly report automation
- A scheduled Netlify Function runs at 00:05 UTC on each user's chosen report day. It computes last month's stats with `src/lib/stats.ts` and saves a report snapshot so issued reports never change.
- An email copy (if enabled) with a summary and a link to the report. PDF export with a print stylesheet or server-rendered PDF.
- Optional AI-written report narrative through the Netlify AI Gateway, added alongside the rule-based insights.

## Milestone 5: Deeper journaling & analytics
- Screenshot or chart uploads on each trade (Netlify Blobs + Image CDN).
- Playbooks: define setups with rules and checklists, then score how well each trade followed them.
- More analytics: time-of-day heatmap, hold-time distribution, MAE/MFE, R-distribution histogram, commission impact, and multiple accounts.
- Saved filters and an editable dashboard layout (drag to reorder widgets).

## Milestone 6: Polish & launch
- Connect the custom domain tradify.com.
- Onboarding wizard, empty states for new accounts, and a guided demo mode.
- Mobile fine-tuning, accessibility audit, and performance budget.
