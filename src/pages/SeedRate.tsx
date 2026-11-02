import SaveBadge from '../components/SaveBadge'
import Segmented from '../components/Segmented'
import { Field, cardCls, inputCls, panelCls } from '../components/ui'
import { usePersistentState } from '../lib/persist'
import { t } from '../utils/i18n'
import { fmtNumber } from '../utils/locale'

const KEY = 'utility-hub.seed.v1'

type AreaUnit = 'm2' | 'ha' | 'acre'
type RateUnit = 'kgha' | 'gm2' | 'lbacre'

interface Form {
  area: string
  areaUnit: AreaUnit
  rate: string
  rateUnit: RateUnit
  wastage: '0' | '10'
}

const DEFAULTS: Form = {
  area: '1',
  areaUnit: 'ha',
  rate: '180',
  rateUnit: 'kgha',
  wastage: '10',
}

const num = (s: string) => {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

const areaM2: Record<AreaUnit, number> = { m2: 1, ha: 10000, acre: 4046.856 }
const rateKgPerM2: Record<RateUnit, number> = {
  kgha: 1 / 10000,
  gm2: 0.001,
  lbacre: 0.45359237 / 4046.856,
}

export default function SeedRate() {
  const [form, setForm, saveState] = usePersistentState<Form>(KEY, DEFAULTS)
  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const area = num(form.area)
  const rate = num(form.rate)

  const seedKg =
    area === null || rate === null || area <= 0 || rate <= 0
      ? null
      : area * areaM2[form.areaUnit] * rate * rateKgPerM2[form.rateUnit]
  const withMargin = seedKg === null ? null : seedKg * (1 + Number(form.wastage) / 100)
  const seedLb = seedKg === null ? null : seedKg / 0.45359237
  const bags25 = withMargin === null ? null : Math.ceil(withMargin / 25)

  const f = (n: number, digits = 2) =>
    fmtNumber(n, { maximumFractionDigits: digits })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Seed Rate Calculator')}
        </h1>
        <SaveBadge state={saveState} />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t(
          'How much seed to buy for a field or plot — supports hectares, acres, m² and mixed rate units.',
        )}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} space-y-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Field')}
          </h2>
          <Field label={t('Area')}>
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
                { id: 'ha', label: 'ha' },
                { id: 'acre', label: 'acre' },
              ]}
              value={form.areaUnit}
              onChange={(v) => set('areaUnit', v)}
            />
          </Field>
          <Field label={t('Seeding rate')}>
            <input
              value={form.rate}
              onChange={(e) => set('rate', e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
            <Segmented
              ariaLabel={t('Rate unit')}
              options={[
                { id: 'kgha', label: 'kg/ha' },
                { id: 'gm2', label: 'g/m²' },
                { id: 'lbacre', label: 'lb/acre' },
              ]}
              value={form.rateUnit}
              onChange={(v) => set('rateUnit', v)}
            />
          </Field>
          <Field label={t('Extra margin')}>
            <Segmented
              ariaLabel={t('Extra margin')}
              options={[
                { id: '0', label: '+0%' },
                { id: '10', label: '+10%' },
              ]}
              value={form.wastage}
              onChange={(v) => set('wastage', v)}
            />
          </Field>
        </div>

        <div className={`${panelCls} space-y-3`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Seed needed')}
          </h2>
          {seedKg === null ? (
            <p className="text-sm text-slate-500">
              {t('Enter an area and rate to see quantities.')}
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('Seed required')}</dt>
                <dd className="font-semibold">
                  {f(seedKg)} kg · {f(seedLb!, 1)} lb
                </dd>
              </div>
              {form.wastage === '10' && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t('With +10% margin')}</dt>
                  <dd className="font-semibold">{f(withMargin!)} kg</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('25 kg bags to buy')}</dt>
                <dd className="font-semibold">{bags25}</dd>
              </div>
            </dl>
          )}
          <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('Typical rates: wheat 150–220 kg/ha, grass ley 25–40 kg/ha, wildflower 3–5 g/m².')}
          </p>
        </div>
      </div>
    </div>
  )
}
