# Tradify

Tradify (tradify.com) is a trading journal that you can shape to fit how you trade. It copies your trades from TradingView, tracks your full history and stats such as win rate, profit factor, expectancy and drawdown, and issues a detailed performance report on the 1st of every month.

## What's in the app today

- **Landing page** (`/`): what Tradify is, with a live product preview.
- **Dashboard** (`/app`): KPI tiles, equity curve, daily P&L calendar, monthly goal, setup edge, mindset vs. results and recent trades. You can filter by 30D, 90D, YTD or All.
- **Journal** (`/app/journal`): search, filter and sort every trade. Open a trade to see its details, or log, edit and delete trades.
- **Monthly reports** (`/app/reports`): one report per completed month, with comparisons to the month before, daily P&L, insights, breakdowns and best/worst trades.
- **Customize** (`/app/settings`): workspace values, accent colour, dashboard widgets, journal fields, report schedule and the TradingView connection.

Everything currently runs on realistic demo data from `src/lib/fixtures.ts`.

## Tech

- TanStack Start (React 19, file-based routing), deployed on Netlify
- Tailwind CSS v4, with design tokens in `src/styles.css`
- Chart.js via react-chartjs-2
- lucide-react icons, and the Instrument Serif, Manrope and JetBrains Mono fonts

## Run locally

```bash
pnpm install
netlify dev        # or: pnpm dev
pnpm test          # unit tests for the stats engine
```

## Roadmap

See [PLAN.md](./PLAN.md). Next up: accounts and persistence (Netlify Identity + Netlify Database), then TradingView sync through webhooks and CSV import, then the scheduled monthly report on the 1st with email delivery.
