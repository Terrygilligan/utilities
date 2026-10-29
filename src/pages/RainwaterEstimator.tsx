import { CloudRain } from 'lucide-react'
import SaveBadge from '../components/SaveBadge'
import Segmented from '../components/Segmented'
import { Field, cardCls, inputCls, panelCls } from '../components/ui'
import { usePersistentState } from '../lib/persist'
import { t } from '../utils/i18n'
import { fmtNumber } from '../utils/locale'

const KEY = 'utility-hub.rainwater.v1'

const SQFT_M2 = 0.09290304
const IN_MM = 25.4
const GAL_L = 3.78541

interface Form {
  area: string
  areaUnit: 'm2' | 'sqft'
  rain: string
  rainUnit: 'mm' | 'in'
  rainPeriod: 'year' | 'month'
  efficiency: string
  storage: string
  usage: string
  volUnit: 'l' | 'gal'
}

const DEFAULTS: Form = {
  area: '100',
  areaUnit: 'm2',
  rain: '800',
  rainUnit: 'mm',
  rainPeriod: 'year',
  efficiency: '90',
  storage: '10000',
  usage: '150',
  volUnit: 'l',
}

const num = (s: string) => {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

export default function RainwaterEstimator() {
  const [form, setForm, saveState] = usePersistentState<Form>(KEY, DEFAULTS)
  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const area = num(form.area)
  const rain = num(form.rain)
  const eff = num(form.efficiency)
  const storage = num(form.storage)
  const usage = num(form.usage)

  const areaM2 = area === null ? null : area * (form.areaUnit === 'sqft' ? SQFT_M2 : 1)
  const rainMm = rain === null ? null : rain * (form.rainUnit === 'in' ? IN_MM : 1)
  const annualRainMm =
    rainMm === null ? null : rainMm * (form.rainPeriod === 'month' ? 12 : 1)

  const annualHarvestL =
    areaM2 === null || annualRainMm === null || eff === null
      ? null
      : areaM2 * annualRainMm * (eff / 100)

  const storageL =
    storage === null ? null : storage * (form.volUnit === 'gal' ? GAL_L : 1)
  const usageL =
    usage === null ? null : usage * (form.volUnit === 'gal' ? GAL_L : 1)

  const autonomyDays =
    storageL === null || usageL === null || usageL <= 0
      ? null
      : storageL / usageL

  const coveredDays =
    annualHarvestL === null || usageL === null || usageL <= 0
      ? null
      : annualHarvestL / usageL

  const vol = (litres: number) =>
    form.volUnit === 'gal' ? litres / GAL_L : litres
  const volUnit = form.volUnit === 'gal' ? 'gal' : 'L'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Rainwater Harvesting & Reserve')}
        </h1>
        <SaveBadge state={saveState} />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('How much water the roof can catch, and how long the tank lasts without rain.')}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} space-y-4`}>
          <Field label={t('Roof catchment area')}>
            <input
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
            <Segmented
              ariaLabel={t('Area unit')}
              options={[
                { id: 'm2', label: 'm²' },
                { id: 'sqft', label: 'sq ft' },
              ]}
              value={form.areaUnit}
              onChange={(v) => set('areaUnit', v)}
            />
          </Field>
          <Field label={t('Rainfall')}>
            <input
              value={form.rain}
              onChange={(e) => set('rain', e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
            <Segmented
              ariaLabel={t('Rainfall unit')}
              options={[
                { id: 'mm', label: 'mm' },
                { id: 'in', label: 'in' },
              ]}
              value={form.rainUnit}
              onChange={(v) => set('rainUnit', v)}
            />
            <Segmented
              ariaLabel={t('Rainfall period')}
              options={[
                { id: 'year', label: t('per year') },
                { id: 'month', label: t('per month') },
              ]}
              value={form.rainPeriod}
              onChange={(v) => set('rainPeriod', v)}
            />
          </Field>
          <Field label={t('Runoff efficiency (%)')}>
            <input
              value={form.efficiency}
              onChange={(e) => set('efficiency', e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label={t('Storage capacity')}>
            <input
              value={form.storage}
              onChange={(e) => set('storage', e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
            <Segmented
              ariaLabel={t('Volume unit')}
              options={[
                { id: 'l', label: 'L' },
                { id: 'gal', label: 'gal' },
              ]}
              value={form.volUnit}
              onChange={(v) => set('volUnit', v)}
            />
          </Field>
          <Field label={t('Daily water usage')}>
            <input
              value={form.usage}
              onChange={(e) => set('usage', e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
            <span className="text-xs text-slate-500">
              {volUnit}/{t('day')}
            </span>
          </Field>
        </div>

        <div className={`${cardCls} space-y-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Harvest & reserve')}
          </h2>

          <div className={panelCls}>
            <p className="text-xs text-slate-500">{t('Annual harvest potential')}</p>
            <p className="mt-1 text-3xl font-bold text-sky-600 dark:text-sky-400">
              {annualHarvestL === null
                ? '—'
                : `${fmtNumber(vol(annualHarvestL), { maximumFractionDigits: 0 })} ${volUnit}`}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {annualHarvestL === null
                ? ''
                : `≈ ${fmtNumber(vol(annualHarvestL / 12), { maximumFractionDigits: 0 })} ${volUnit}/${t('month')}`}
            </p>
          </div>

          <div className={panelCls}>
            <p className="text-xs text-slate-500">{t('Reserve autonomy')}</p>
            <p className="mt-1 text-3xl font-bold text-sky-600 dark:text-sky-400">
              {autonomyDays === null
                ? '—'
                : `${fmtNumber(autonomyDays, { maximumFractionDigits: 0 })} ${t('days')}`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t('Days the stored water lasts with no rainfall.')}
            </p>
          </div>

          <div className="space-y-1.5 font-mono text-sm">
            <p className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>{t('Days of usage covered per year')}</span>
              <b className="text-sky-600 dark:text-sky-400">
                {coveredDays === null
                  ? '—'
                  : fmtNumber(coveredDays, { maximumFractionDigits: 0 })}
              </b>
            </p>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <CloudRain size={13} />
            {t('1 mm of rain on 1 m² of roof ≈ 1 L. Efficiency covers first-flush and gutter losses.')}
          </p>
        </div>
      </div>
    </div>
  )
}
