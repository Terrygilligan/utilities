import { useMemo, useState } from 'react'
import { AlarmClockCheck, Info } from 'lucide-react'
import { fmtDateTime } from '../utils/locale'
import { t, LANG } from '../utils/i18n'

const FIELD_NAMES = ['minute', 'hour', 'day of month', 'month', 'day of week'] as const
const FIELD_PLURALS = ['minutes', 'hours', 'days of month', 'months', 'days of week'] as const
const RANGES: [number, number][] = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]]
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseField(raw: string, lo: number, hi: number): Set<number> | null {
  const out = new Set<number>()
  const names = { ...Object.fromEntries(DOW.map((n, i) => [n.toLowerCase(), i === 7 ? 0 : i])), ...Object.fromEntries(MON.map((n, i) => [n.toLowerCase(), i + 1])) }
  for (const part of raw.split(',')) {
    const m = part.match(/^([*]|[\w-]+)(?:\/(\d+))?$/)
    if (!m) return null
    const step = m[2] ? +m[2] : 1
    if (m[1] === '*') {
      for (let v = lo; v <= hi; v += step) out.add(v % 8 === 7 && hi === 7 ? 0 : v)
      continue
    }
    const num = (t: string) => (names[t.toLowerCase()] ?? parseInt(t, 10))
    const [a, b] = m[1].includes('-') ? m[1].split('-').map(num) : [num(m[1]), num(m[1]) + (m[2] ? hi : 0)]
    if (isNaN(a) || isNaN(b) || a < lo || Math.min(b, hi) < a) return null
    for (let v = a; v <= Math.min(b, hi); v += step) out.add(v === 7 && hi === 7 ? 0 : v)
  }
  return out.size ? out : null
}

function describe(field: string, name: string, plural: string, lo: number, hi: number): string {
  if (field === '*') return t(`every ${name}`)
  const set = parseField(field, lo, hi)
  if (!set) return `${t('invalid')} ${t(name)}`
  if (field.includes('/')) {
    const [, step] = field.split('/')
    return `${t('every')} ${step} ${t(plural)}`
  }
  const label = (v: number) => name === 'day of week' ? DOW[v] : name === 'month' ? MON[v - 1] : String(v)
  return `${t(name)} ${[...set].map(label).join(', ')}`
}

export default function CronExplainer() {
  const [expr, setExpr] = useState('0 9 * * 1-5')

  const result = useMemo(() => {
    const fields = expr.trim().split(/\s+/)
    if (fields.length !== 5) return { error: t('Expected 5 fields: minute hour day-of-month month day-of-week') }
    const parsed = fields.map((f, i) => parseField(f, RANGES[i][0], RANGES[i][1]))
    if (parsed.some((p) => p === null)) return { error: t('Could not parse one or more fields.') }
    const [min, hr, dom, mon, dow] = parsed as Set<number>[]
    const desc = fields.map((f, i) => describe(f, FIELD_NAMES[i], FIELD_PLURALS[i], RANGES[i][0], RANGES[i][1]))
    const runs: number[] = []
    const d = new Date()
    d.setSeconds(0, 0)
    d.setMinutes(d.getMinutes() + 1)
    let guard = 0
    while (runs.length < 5 && guard++ < 527040) {
      if (min.has(d.getMinutes()) && hr.has(d.getHours()) && mon.has(d.getMonth() + 1) &&
          dom.has(d.getDate()) && dow.has(d.getDay())) runs.push(d.getTime())
      d.setMinutes(d.getMinutes() + 1)
    }
    return { desc, runs }
  }, [expr, LANG])

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Cron Expression Explainer')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Paste a 5-field cron expression — get a field-by-field breakdown and the next run times.')}
      </p>

      <input value={expr} onChange={(e) => setExpr(e.target.value)} spellCheck={false}
        className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-lg tracking-wider dark:border-slate-700 dark:bg-slate-950/60"
        placeholder="* * * * *" />

      <div className="mt-2 flex flex-wrap gap-2">
        {['* * * * *', '0 9 * * 1-5', '*/15 * * * *', '30 2 1 * *', '0 0 * * 0'].map((ex) => (
          <button key={ex} type="button" onClick={() => setExpr(ex)}
            className="h-8 rounded-lg border border-slate-300 px-3 font-mono text-xs text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            {ex}
          </button>
        ))}
      </div>

      {'error' in result ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><Info size={15} /> {result.error}</p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ul className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {result.desc!.map((d, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-800">
                <span className="font-mono text-slate-500">{expr.trim().split(/\s+/)[i]}</span>
                <span className="font-medium capitalize">{d}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <AlarmClockCheck size={13} /> {t('Next runs')}
            </h3>
            <ul className="mt-2 space-y-1.5 font-mono text-sm text-slate-700 dark:text-slate-300">
              {result.runs!.map((t) => <li key={t}>{fmtDateTime(t)}</li>)}
              {!result.runs!.length && <li className="text-slate-500">{t('No runs within the next year.')}</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
