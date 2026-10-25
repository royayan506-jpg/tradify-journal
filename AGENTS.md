# AGENTS.md — Tradify

Tradify is a customizable trading journal built with TanStack Start and React 19 on Netlify. **Read `PLAN.md` first.** Milestone 1 (the product surface) is done. Continue with the next unchecked milestone.

## Architecture

- `src/routes/index.tsx`: the marketing landing page. It is SSR-safe and uses an SVG `Sparkline`, not Chart.js.
- `src/routes/app.tsx`: the app shell (sidebar, mobile drawer, toast). It wraps everything in `JournalProvider` and sets `--color-accent` from the workspace settings, so the user's accent colour applies throughout the app.
- `src/routes/app.index.tsx`: the Dashboard. `app.journal.tsx` is the Journal, `app.reports.tsx` is Monthly reports, and `app.settings.tsx` is Customize, including the TradingView connect flow.
- `src/lib/types.ts`: the domain types (`Trade`, `Workspace`, `Connection`). Keep these stable, because database rows should map onto them.
- `src/lib/fixtures.ts`: **the only source of demo data.** It uses a seeded PRNG so SSR and client output match. `demoNow` pins "today" to 2026-10-25.
- `src/lib/store.tsx`: the `useJournal()` context with an in-memory state and actions. Milestone 2 replaces the actions with server functions backed by Netlify Database, keeping the same API.
- `src/lib/stats.ts`: pure analytics (stats, equity curve, daily P&L, grouping, report insights). It is reused by the UI and should be reused by the future scheduled report function. It has tests in `stats.test.ts`.
- `src/lib/format.ts`: formatting for money, percentages, R-multiples and dates (always UTC), plus `pnlClass` and `cx`.
- `src/components/`: `ui.tsx` (Logo, StatTile, Segmented, Sheet, Toggle, SideChip, useMounted), `charts.tsx`, `PnlCalendar.tsx` and `TradeForm.tsx`.

## Conventions

- Dark theme only. Use the tokens in `src/styles.css` (`ink`, `panel`, `line`, `fg`, `muted`, `dim`, `accent`, `gain`, `loss`, `warn`) and the custom utilities `card`, `btn-primary`, `btn-ghost`, `field`, `label`, `chip` and `num`. Use `num` (mono, tabular figures) for every number.
- Headlines use `font-display` (Instrument Serif), often with an `<em>` for the italic accent.
- Chart.js renders only after mount (`useMounted`) and shows a skeleton during SSR.
- Format all dates with `timeZone: 'UTC'` to avoid hydration mismatches.
- Green and red mean profit and loss only. Do not use them for decoration.

## Non-obvious decisions

- TradingView has no public trade-history API. The planned sync is webhook ingest, CSV import and optional broker APIs (see PLAN.md, milestone 3).
- Monthly reports are derived from the trades on the fly for now. Milestone 4 adds snapshot storage so issued reports stay fixed after the 1st.
- TypeScript stays on v6, because the Netlify adapter needs compiler APIs that v7 removed.
