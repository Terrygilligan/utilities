import { useMemo, useState } from 'react'
import { cardCls, inputCls } from '../components/ui'
import { t } from '../utils/i18n'

const DAY = 86_400_000
const toDate = (s: string) => (s ? new Date(`${s}T00:00:00`) : null)
const fmt = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })

function ageParts(birth: Date, now: Date) {
  let y = now.getFullYear() - birth.getFullYear()
  let m = now.getMonth() - birth.getMonth()
  let d = now.getDate() - birth.getDate()
  if (d < 0) {
    m -= 1
    d += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  }
  if (m < 0) {
    y -= 1
    m += 12
  }
  return { y, m, d }
}

function nextBirthday(birth: Date, now: Date) {
  let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (next.getTime() <= now.getTime())
    next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
  return next
}

export default function DateAge() {
  const [birth, setBirth] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [days, setDays] = useState(30)

  const now = useMemo(() => {
    const n = new Date()
    n.setHours(0, 0, 0, 0)
    return n
  }, [])

  const birthDate = toDate(birth)
  const age = birthDate && birthDate <= now ? ageParts(birthDate, now) : null
  const bdayIn = birthDate ? Math.round((nextBirthday(birthDate, now).getTime() - now.getTime()) / DAY) : null

  const fromDate = toDate(from)
  const toDate_ = toDate(to)
  const diffDays = fromDate && toDate_ ? Math.round(Math.abs(toDate_.getTime() - fromDate.getTime()) / DAY) : null

  const startDate = toDate(start)
  const result = startDate ? new Date(startDate.getTime() + days * DAY) : null

  const label = 'text-xs font-medium text-slate-500'
  const big = 'mt-1 text-xl font-bold tabular-nums'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Date & Age Calculator')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Age, days between dates, and add-or-subtract date math — instant and offline.')}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={cardCls}>
          <span className={label}>{t('Your birthdate')}</span>
          <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className={`${inputCls} mt-1`} />
          {age ? (
            <>
              <p className={big}>{t('{y}y {m}m {d}d', { y: age.y, m: age.m, d: age.d })}</p>
              <p className="mt-1 text-xs text-slate-500">
                {t('{years} years, {months} months, {days} days', { years: age.y, months: age.m, days: age.d })}
              </p>
              {bdayIn !== null && (
                <p className="mt-2 text-sm font-medium text-sky-600 dark:text-sky-400">
                  {t('Next birthday in {days} days', { days: bdayIn })}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{t('Pick a date')}</p>
          )}
        </div>

        <div className={cardCls}>
          <span className={label}>{t('Days between two dates')}</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} aria-label={t('From')} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} aria-label={t('To')} />
          </div>
          {diffDays !== null ? (
            <p className={big}>
              {t('{days} days', { days: diffDays })}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{t('Pick both dates')}</p>
          )}
          {diffDays !== null && (
            <p className="mt-1 text-xs text-slate-500">
              {t('{weeks} weeks · {months} months', { weeks: Math.floor(diffDays / 7), months: Math.floor(diffDays / 30.44) })}
            </p>
          )}
        </div>

        <div className={cardCls}>
          <span className={label}>{t('Add or subtract days')}</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} aria-label={t('Start date')} />
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.trunc(+e.target.value || 0))}
              className={inputCls}
              aria-label={t('Days')}
            />
          </div>
          {result && (
            <>
              <p className={big}>{fmt(result)}</p>
              <p className="mt-1 text-xs text-slate-500">{result.toISOString().slice(0, 10)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
