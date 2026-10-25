import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ScriptableContext,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { fmtDate, fmtMoney } from '../lib/format'
import { useMounted } from './ui'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, Filler, Tooltip)

const GAIN = '#5ee0a0'
const LOSS = '#ff6b7a'
const GRID = 'rgba(255,255,255,0.05)'
const TICK = '#6b746e'

const tooltip = {
  backgroundColor: '#1b201d',
  borderColor: '#333a36',
  borderWidth: 1,
  titleColor: '#9aa39d',
  bodyColor: '#eef1ec',
  padding: 12,
  cornerRadius: 10,
  displayColors: false,
  titleFont: { family: 'Manrope', weight: 500 as const },
  bodyFont: { family: 'JetBrains Mono', size: 13 },
}

const axis = {
  grid: { color: GRID },
  border: { display: false },
  ticks: { color: TICK, font: { family: 'JetBrains Mono', size: 11 } },
}

function Skeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-xl bg-panel-2/60"
      style={{ height }}
      aria-hidden
    />
  )
}

export function EquityChart({
  points,
  accent,
  height = 280,
}: {
  points: { day: string; equity: number }[]
  accent: string
  height?: number
}) {
  const mounted = useMounted()
  if (!mounted) return <Skeleton height={height} />
  return (
    <div style={{ height }} className="relative">
      <Line
        aria-label="Equity curve"
        role="img"
        data={{
          labels: points.map((p) => fmtDate(p.day)),
          datasets: [
            {
              data: points.map((p) => p.equity),
              borderColor: accent,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: accent,
              tension: 0.35,
              fill: true,
              backgroundColor: (ctx: ScriptableContext<'line'>) => {
                const { chart } = ctx
                const area = chart.chartArea
                if (!area) return 'transparent'
                const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
                g.addColorStop(0, `${accent}40`)
                g.addColorStop(1, `${accent}00`)
                return g
              },
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 900, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            tooltip: {
              ...tooltip,
              callbacks: { label: (c) => fmtMoney(c.parsed.y ?? 0) },
            },
          },
          scales: {
            x: { ...axis, grid: { display: false }, ticks: { ...axis.ticks, maxTicksLimit: 7 } },
            y: {
              ...axis,
              ticks: {
                ...axis.ticks,
                maxTicksLimit: 5,
                callback: (v) => fmtMoney(Number(v)),
              },
            },
          },
        }}
      />
    </div>
  )
}

export function DailyBars({
  points,
  height = 220,
}: {
  points: { day: string; pnl: number }[]
  height?: number
}) {
  const mounted = useMounted()
  if (!mounted) return <Skeleton height={height} />
  return (
    <div style={{ height }} className="relative">
      <Bar
        aria-label="Daily net P&L"
        role="img"
        data={{
          labels: points.map((p) => fmtDate(p.day)),
          datasets: [
            {
              data: points.map((p) => p.pnl),
              backgroundColor: points.map((p) => (p.pnl >= 0 ? GAIN : LOSS)),
              borderRadius: 4,
              maxBarThickness: 18,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700 },
          plugins: {
            tooltip: {
              ...tooltip,
              callbacks: { label: (c) => fmtMoney(c.parsed.y ?? 0, { sign: true }) },
            },
          },
          scales: {
            x: { ...axis, grid: { display: false }, ticks: { ...axis.ticks, maxTicksLimit: 10 } },
            y: {
              ...axis,
              ticks: { ...axis.ticks, maxTicksLimit: 5, callback: (v) => fmtMoney(Number(v)) },
            },
          },
        }}
      />
    </div>
  )
}

/** Lightweight SVG sparkline for SSR-safe previews (landing page, tiles). */
export function Sparkline({
  values,
  stroke = 'var(--color-accent)',
  className = '',
}: {
  values: number[]
  stroke?: string
  className?: string
}) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const w = 100
  const h = 32
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / (max - min || 1)) * h
      return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={stroke} opacity="0.12" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
