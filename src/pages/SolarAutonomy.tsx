import { BatteryCharging } from 'lucide-react'
import SaveBadge from '../components/SaveBadge'
import Segmented from '../components/Segmented'
import { Field, cardCls, inputCls, panelCls } from '../components/ui'
import { usePersistentState } from '../lib/persist'
import { t } from '../utils/i18n'
import { fmtNumber } from '../utils/locale'

const KEY = 'utility-hub.solar-autonomy.v1'

interface Form {
  cap: string
  capUnit: 'kwh' | 'ah'
  voltage: string
  soc: string
  minLimit: string
  load: string
  solar: string
}

const DEFAULTS: Form = {
  cap: '10',
  capUnit: 'kwh',
  voltage: '12',
  soc: '100',
  minLimit: '20',
  load: '350',
  solar: '0',
}

const num = (s: string) => {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

type Status = 'safe' | 'moderate' | 'critical'

const STATUS_STYLE: Record<Status, string> = {
  safe: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  moderate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  critical: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

export default function SolarAutonomy() {
  const [form, setForm, saveState] = usePersistentState<Form>(KEY, DEFAULTS)
  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const cap = num(form.cap)
  const voltage = num(form.voltage)
  const soc = num(form.soc)
  const minLimit = num(form.minLimit)
  const load = num(form.load)
  const solar = num(form.solar)

  const capacityKwh =
    cap === null
      ? null
      : form.capUnit === 'kwh'
        ? cap
        : voltage === null
          ? null
          : (cap * voltage) / 1000

  const usableKwh =
    capacityKwh === null || soc === null || minLimit === null
      ? null
      : capacityKwh * (Math.max(0, soc - minLimit) / 100)

  const netKw = load === null || solar === null ? null : (load - solar) / 1000

  const hours =
    usableKwh === null || netKw === null || netKw <= 0
      ? null
      : usableKwh / netKw

  const depleted = soc !== null && minLimit !== null && soc <= minLimit

  let status: Status = 'moderate'
  if (depleted || (hours !== null && hours < 8)) status = 'critical'
  else if (netKw !== null && netKw <= 0) status = 'safe'
  else if (hours !== null && hours >= 24) status = 'safe'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Solar & Battery Autonomy')}
        </h1>
        <SaveBadge state={saveState} />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('How long can the battery bank carry the homestead load? Energy, load, and optional solar input.')}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} space-y-4`}>
          <Field label={t('Battery capacity')}>
            <input
              value={form.cap}
              onChange={(e) => set('cap', e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
            <Segmented
              ariaLabel={t('Capacity unit')}
              options={[
                { id: 'kwh', label: 'kWh' },
                { id: 'ah', label: 'Ah' },
              ]}
              value={form.capUnit}
              onChange={(v) => set('capUnit', v)}
            />
          </Field>
          {form.capUnit === 'ah' && (
            <Field label={t('Battery voltage')}>
              <input
                value={form.voltage}
                onChange={(e) => set('voltage', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
              <span className="text-xs text-slate-500">V</span>
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('State of charge (%)')}>
              <input
                value={form.soc}
                onChange={(e) => set('soc', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            <Field label={t('Minimum discharge limit (%)')}>
              <input
                value={form.minLimit}
                onChange={(e) => set('minLimit', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            <Field label={t('Continuous base load (W)')}>
              <input
                value={form.load}
                onChange={(e) => set('load', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            <Field label={t('Solar input assist (W)')}>
              <input
                value={form.solar}
                onChange={(e) => set('solar', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div className={`${cardCls} space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('Autonomy estimate')}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
            >
              {status === 'safe'
                ? t('Safe')
                : status === 'moderate'
                  ? t('Moderate')
                  : t('Critical discharge')}
            </span>
          </div>

          <div className={panelCls}>
            {netKw !== null && netKw <= 0 ? (
              <>
                <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                  {t('Indefinite')}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {t('Solar input meets or exceeds the load — the battery holds while the sun shines.')}
                </p>
              </>
            ) : depleted ? (
              <>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  0 {t('hours')}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {t('State of charge is at or below the minimum discharge limit.')}
                </p>
              </>
            ) : hours !== null ? (
              <>
                <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                  {fmtNumber(hours, { maximumFractionDigits: 1 })} {t('hours')}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  ≈ {fmtNumber(hours / 24, { maximumFractionDigits: 2 })} {t('days')}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-slate-400">—</p>
            )}
          </div>

          <div className="space-y-1.5 font-mono text-sm">
            <p className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>{t('Usable energy')}</span>
              <b className="text-sky-600 dark:text-sky-400">
                {usableKwh === null
                  ? '—'
                  : `${fmtNumber(usableKwh, { maximumFractionDigits: 2 })} kWh`}
              </b>
            </p>
            <p className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>{t('Net hourly consumption')}</span>
              <b className="text-sky-600 dark:text-sky-400">
                {netKw === null
                  ? '—'
                  : `${fmtNumber(netKw, { maximumFractionDigits: 3 })} kW`}
              </b>
            </p>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <BatteryCharging size={13} />
            {t('Usable energy = capacity × (SoC − minimum limit). Defaults suit LiFePO4 banks.')}
          </p>
        </div>
      </div>
    </div>
  )
}
