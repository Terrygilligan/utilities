import { useMemo, useState } from 'react'
import { ArrowRightLeft, Scale, Thermometer, Ruler, HardDrive } from 'lucide-react'

type Cat = 'length' | 'weight' | 'temp' | 'data'

const UNITS: Record<Cat, { label: string; icon: typeof Ruler; units: Record<string, number | undefined> }> = {
  length: {
    label: 'Length', icon: Ruler,
    units: { meters: 1, kilometers: 1000, centimeters: 0.01, millimeters: 0.001, miles: 1609.344, yards: 0.9144, feet: 0.3048, inches: 0.0254 },
  },
  weight: {
    label: 'Weight', icon: Scale,
    units: { kilograms: 1, grams: 0.001, milligrams: 1e-6, tonnes: 1000, pounds: 0.45359237, ounces: 0.028349523125, stone: 6.35029318 },
  },
  temp: { label: 'Temperature', icon: Thermometer, units: {} },
  data: {
    label: 'Data storage', icon: HardDrive,
    units: { bytes: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4, bits: 0.125, kilobits: 125, megabits: 125e3 },
  },
}

const TEMP_UNITS = ['celsius', 'fahrenheit', 'kelvin']

function convertTemp(v: number, from: string, to: string): number {
  const c = from === 'celsius' ? v : from === 'fahrenheit' ? (v - 32) * (5 / 9) : v - 273.15
  return to === 'celsius' ? c : to === 'fahrenheit' ? c * (9 / 5) + 32 : c + 273.15
}

function fmt(n: number): string {
  if (!isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return n.toExponential(4)
  return parseFloat(n.toPrecision(10)).toLocaleString(undefined, { maximumFractionDigits: 8 })
}

export default function UnitConverter() {
  const [cat, setCat] = useState<Cat>('length')
  const [from, setFrom] = useState('meters')
  const [to, setTo] = useState('feet')
  const [input, setInput] = useState('1')

  const unitList = cat === 'temp' ? TEMP_UNITS : Object.keys(UNITS[cat].units)

  const switchCat = (c: Cat) => {
    setCat(c)
    const list = c === 'temp' ? TEMP_UNITS : Object.keys(UNITS[c].units)
    setFrom(list[0])
    setTo(list[1] ?? list[0])
  }

  const result = useMemo(() => {
    const v = parseFloat(input)
    if (isNaN(v)) return null
    if (cat === 'temp') return convertTemp(v, from, to)
    const f = UNITS[cat].units[from]!, t = UNITS[cat].units[to]!
    return (v * f) / t
  }, [input, cat, from, to])

  const sel = 'rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Unit Converter</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Instant offline conversions — length, weight, temperature, and data storage.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(UNITS) as Cat[]).map((c) => {
          const Icon = UNITS[c].icon
          return (
            <button key={c} type="button" onClick={() => switchCat(c)}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition ${cat === c ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
              <Icon size={15} /> {UNITS[c].label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <label className="text-sm">
            <span className="text-xs text-slate-500">From</span>
            <div className="mt-1 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                inputMode="decimal" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-lg dark:border-slate-700 dark:bg-slate-950/60" />
              <select value={from} onChange={(e) => setFrom(e.target.value)} className={sel}>
                {unitList.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </label>
          <button type="button" aria-label="Swap units" title="Swap units"
            onClick={() => { setFrom(to); setTo(from) }}
            className="mb-1 hidden h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 sm:flex dark:hover:bg-slate-800 dark:hover:text-white">
            <ArrowRightLeft size={16} />
          </button>
          <label className="text-sm">
            <span className="text-xs text-slate-500">To</span>
            <div className="mt-1 flex gap-2">
              <output className="min-w-0 flex-1 truncate rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-lg text-sky-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-sky-400">
                {result === null ? '—' : fmt(result)}
              </output>
              <select value={to} onChange={(e) => setTo(e.target.value)} className={sel}>
                {unitList.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
