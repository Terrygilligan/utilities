import { useMemo, useState } from 'react'
import { Calculator, Globe2, Percent } from 'lucide-react'
import { CURRENCY, fmtDateTime, fmtMoney, fmtNumber } from '../utils/locale'

const ZONES = [
  'Europe/Dublin', 'Europe/London', 'Europe/Sofia', 'Europe/Amsterdam', 'Europe/Berlin',
  'Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Warsaw', 'Europe/Athens',
  'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Moscow', 'Africa/Cairo', 'Asia/Dubai',
  'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Mexico_City',
  'America/Sao_Paulo', 'UTC',
]

type Tab = 'time' | 'percent'

function TimeZonePanel() {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone
  const [iso, setIso] = useState(() => new Date().toISOString().slice(0, 16))
  const [from, setFrom] = useState(local)
  const [to, setTo] = useState(local === 'Europe/London' ? 'America/New_York' : 'Europe/London')

  const result = useMemo(() => {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null
    try {
      return {
        target: new Intl.DateTimeFormat(undefined, {
          timeZone: to, dateStyle: 'full', timeStyle: 'medium',
        }).format(d),
        nowHere: fmtDateTime(Date.now()),
        nowThere: new Intl.DateTimeFormat(undefined, { timeZone: to, hour: 'numeric', minute: '2-digit' }).format(d),
      }
    } catch {
      return null
    }
  }, [iso, to])

  const sel = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60'
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-xs text-slate-500">Date &amp; time
          <input type="datetime-local" value={iso} onChange={(e) => setIso(e.target.value)} className={`${sel} mt-1`} />
        </label>
        <label className="text-xs text-slate-500">From zone
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={`${sel} mt-1`}>
            {[local, ...ZONES.filter((z) => z !== local)].map((z) => <option key={z}>{z.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-500">To zone
          <select value={to} onChange={(e) => setTo(e.target.value)} className={`${sel} mt-1`}>
            {ZONES.map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
      </div>
      {result && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-lg font-semibold text-sky-600 dark:text-sky-400">{result.target}</p>
          <p className="mt-1 text-xs text-slate-500">
            Right now: {result.nowHere} here · {result.nowThere} in {to.replace(/_/g, ' ')}
          </p>
        </div>
      )}
    </div>
  )
}

function PercentPanel() {
  const [a, setA] = useState('20')
  const [b, setB] = useState('100')
  const [from, setFrom] = useState('80')
  const [to, setTo] = useState('100')
  const [net, setNet] = useState('120')
  const [vat, setVat] = useState(20)

  const n = (s: string) => { const v = parseFloat(s); return isNaN(v) ? null : v }
  const box = 'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'
  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60'
  const A = n(a), B = n(b), F = n(from), T = n(to), N = n(net)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className={box}>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">X% of Y</h3>
        <div className="mt-3 flex items-center gap-2">
          <input value={a} onChange={(e) => setA(e.target.value)} inputMode="decimal" className={input} />
          <span className="text-xs text-slate-500">% of</span>
          <input value={b} onChange={(e) => setB(e.target.value)} inputMode="decimal" className={input} />
        </div>
        <p className="mt-3 font-mono text-xl text-sky-600 dark:text-sky-400">
          {A !== null && B !== null ? fmtNumber((A / 100) * B) : '—'}
        </p>
      </div>
      <div className={box}>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">% change</h3>
        <div className="mt-3 flex items-center gap-2">
          <input value={from} onChange={(e) => setFrom(e.target.value)} inputMode="decimal" className={input} />
          <span className="text-xs text-slate-500">→</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} inputMode="decimal" className={input} />
        </div>
        <p className="mt-3 font-mono text-xl text-sky-600 dark:text-sky-400">
          {F !== null && T !== null && F !== 0
            ? `${T >= F ? '+' : ''}${fmtNumber(((T - F) / Math.abs(F)) * 100)}%`
            : '—'}
        </p>
      </div>
      <div className={box}>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">VAT / tax ({CURRENCY})</h3>
        <div className="mt-3 flex items-center gap-2">
          <input value={net} onChange={(e) => setNet(e.target.value)} inputMode="decimal" className={input} />
          <select value={vat} onChange={(e) => setVat(+e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60">
            {[0, 5, 9, 10, 13.5, 20, 21, 23, 24, 25].map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
        {N !== null && (
          <div className="mt-3 space-y-1 font-mono text-sm">
            <p className="text-slate-700 dark:text-slate-300">Gross: <b className="text-sky-600 dark:text-sky-400">{fmtMoney(N * (1 + vat / 100))}</b></p>
            <p className="text-slate-700 dark:text-slate-300">From gross: <b className="text-sky-600 dark:text-sky-400">{fmtMoney(N / (1 + vat / 100))}</b></p>
            <p className="text-xs text-slate-500">Tax portion: {fmtMoney(N * (vat / 100))}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalcTools() {
  const [tab, setTab] = useState<Tab>('percent')
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Calc &amp; Time Converter</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Percentages, VAT/tax, and time zones — formatted for your region, computed offline.
      </p>
      <div role="tablist" className="mt-6 flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {([{ id: 'percent', label: 'Percent & VAT', icon: Percent }, { id: 'time', label: 'Time zones', icon: Globe2 }] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition sm:text-sm ${tab === id ? 'bg-slate-200 text-slate-900 shadow dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === 'time' ? <TimeZonePanel /> : <PercentPanel />}
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Calculator size={13} /> Results format automatically to your device locale.
      </p>
    </div>
  )
}
