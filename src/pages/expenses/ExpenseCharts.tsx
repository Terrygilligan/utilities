import { LOCALE, fmtMoney } from '../../utils/locale'
import { t } from '../../utils/i18n'

const SLICE_COLORS = [
  '#0ea5e9', '#6366f1', '#7dd3fc', '#94a3b8',
  '#0284c7', '#a5b4fc', '#0369a1', '#cbd5e1',
]

export function CurrencyToggle({
  currencies,
  available,
  value,
  onChange,
}: {
  currencies: readonly string[]
  available: ReadonlySet<string>
  value: string
  onChange: (c: string) => void
}) {
  return (
    <div className="flex gap-1">
      {currencies.map((c) => (
        <button
          key={c}
          type="button"
          disabled={!available.has(c)}
          onClick={() => onChange(c)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            c === value
              ? 'bg-sky-500 text-white'
              : 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}>
          {c}
        </button>
      ))}
    </div>
  )
}

const niceCeil = (v: number) => {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

export function MonthlyBarChart({
  data,
  currency,
}: {
  data: { month: string; total: number }[]
  currency: string
}) {
  const W = 320
  const H = 150
  const ML = 36
  const MR = 6
  const MT = 8
  const MB = 18
  const plotW = W - ML - MR
  const plotH = H - MT - MB

  const niceMax = niceCeil(Math.max(...data.map((d) => d.total)))
  const tickFmt = new Intl.NumberFormat(LOCALE, { notation: 'compact' })
  const ticks = [0, 1, 2, 3].map((i) => (niceMax * i) / 3)

  const multiYear =
    data.length > 12 || new Set(data.map((d) => d.month.slice(0, 4))).size > 1
  const labelFmt = new Intl.DateTimeFormat(
    LOCALE,
    multiYear ? { month: 'short', year: '2-digit' } : { month: 'short' },
  )
  const labelEvery = Math.max(1, Math.ceil(data.length / 10))

  const slot = plotW / data.length
  const bw = Math.max(3, Math.min(40, slot * 0.55))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={t('Monthly spending in {currency}', { currency })}>
      {ticks.map((t) => {
        const y = MT + plotH - (t / niceMax) * plotH
        return (
          <g key={t}>
            <line
              x1={ML} y1={y} x2={W - MR} y2={y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={1}
            />
            <text
              x={ML - 4} y={y + 3} textAnchor="end"
              className="fill-slate-400 text-[8px] dark:fill-slate-500">
              {tickFmt.format(t)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const h = Math.max(1, (d.total / niceMax) * plotH)
        const x = ML + i * slot + (slot - bw) / 2
        return (
          <g key={d.month}>
            <rect
              x={x} y={MT + plotH - h} width={bw} height={h} rx={2}
              className="fill-sky-500 hover:fill-sky-400 dark:fill-sky-400 dark:hover:fill-sky-300">
              <title>{t('{month}: {amount}', { month: d.month, amount: fmtMoney(d.total, currency) })}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text
                x={ML + i * slot + slot / 2} y={H - 5} textAnchor="middle"
                className="fill-slate-500 text-[8px] dark:fill-slate-400">
                {labelFmt.format(new Date(d.month + '-01T00:00:00'))}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

const CX = 60
const CY = 60
const R_OUT = 50
const R_IN = 30

const polar = (r: number, a: number): readonly [number, number] => [
  CX + r * Math.cos(a),
  CY + r * Math.sin(a),
]

const slicePath = (a0: number, a1: number) => {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [x0o, y0o] = polar(R_OUT, a0)
  const [x1o, y1o] = polar(R_OUT, a1)
  const [x1i, y1i] = polar(R_IN, a1)
  const [x0i, y0i] = polar(R_IN, a0)
  return `M${x0o} ${y0o} A${R_OUT} ${R_OUT} 0 ${large} 1 ${x1o} ${y1o} L${x1i} ${y1i} A${R_IN} ${R_IN} 0 ${large} 0 ${x0i} ${y0i} Z`
}

export function CategoryDonut({
  data,
  currency,
}: {
  data: { label: string; total: number }[]
  currency: string
}) {
  const total = data.reduce((s, d) => s + d.total, 0)
  let angle = -Math.PI / 2

  return (
    <div>
      <svg
        viewBox="0 0 120 120"
        className="mx-auto h-40 w-40"
        role="img"
        aria-label={t('Expenses by category in {currency}', { currency })}>
        {data.map((d, i) => {
          const frac = d.total / total
          const a1 =
            i === data.length - 1 ? Math.PI * 1.5 : angle + frac * Math.PI * 2
          const path = slicePath(angle, Math.min(a1, angle + Math.PI * 2 - 0.0001))
          angle = a1
          return (
            <path
              key={d.label}
              d={path}
              fill={SLICE_COLORS[i % SLICE_COLORS.length]}
              className="opacity-90 transition hover:opacity-100">
              <title>{t('{label}: {amount} ({pct}%)', { label: d.label, amount: fmtMoney(d.total, currency), pct: Math.round(frac * 100) })}</title>
            </path>
          )
        })}
        <text
          x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
          className="fill-slate-700 text-[9px] font-semibold dark:fill-slate-200">
          {fmtMoney(total, currency)}
        </text>
      </svg>
      <ul className="mt-2 space-y-1 text-xs">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
              {d.label}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-slate-500">
              {fmtMoney(d.total, currency)} · {Math.round((d.total / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
