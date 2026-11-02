import SaveBadge from '../components/SaveBadge'
import Segmented from '../components/Segmented'
import { Field, cardCls, inputCls, panelCls } from '../components/ui'
import { usePersistentState } from '../lib/persist'
import { t } from '../utils/i18n'
import { fmtNumber } from '../utils/locale'

const KEY = 'utility-hub.pond.v1'

interface Form {
  length: string
  width: string
  depth: string
  unit: 'm' | 'ft'
  shape: 'rect' | 'oval'
}

const DEFAULTS: Form = {
  length: '6',
  width: '4',
  depth: '1.2',
  unit: 'm',
  shape: 'oval',
}

const num = (s: string) => {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

const M3_PER_FT3 = 0.0283168466
const L_PER_M3 = 1000
const GAL_PER_M3 = 264.172

export default function PondVolume() {
  const [form, setForm, saveState] = usePersistentState<Form>(KEY, DEFAULTS)
  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const length = num(form.length)
  const width = num(form.width)
  const depth = num(form.depth)

  const shapeFactor = form.shape === 'oval' ? 0.7854 : 1
  const rawVolume =
    length === null || width === null || depth === null
      ? null
      : length * width * depth * shapeFactor
  const volumeM3 =
    rawVolume === null ? null : rawVolume * (form.unit === 'ft' ? M3_PER_FT3 : 1)

  const litres = volumeM3 === null ? null : volumeM3 * L_PER_M3
  const gallons = volumeM3 === null ? null : volumeM3 * GAL_PER_M3
  const linerM2 =
    length === null || width === null || depth === null
      ? null
      : (length + 2 * depth + 0.6) * (width + 2 * depth + 0.6) *
        (form.unit === 'ft' ? 0.09290304 : 1)

  const f = (n: number, digits = 2) =>
    fmtNumber(n, { maximumFractionDigits: digits })
  const f0 = (n: number) => fmtNumber(n, { maximumFractionDigits: 0 })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Pond Volume Calculator')}
        </h1>
        <SaveBadge state={saveState} />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Water volume in litres and US gallons from pond dimensions — plus an estimated liner size with overlap.',
        )}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} space-y-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Dimensions')}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <Field label={t('Units')}>
              <Segmented
                ariaLabel={t('Units')}
                options={[
                  { id: 'm', label: 'm' },
                  { id: 'ft', label: 'ft' },
                ]}
                value={form.unit}
                onChange={(v) => set('unit', v)}
              />
            </Field>
            <Field label={t('Shape')}>
              <Segmented
                ariaLabel={t('Shape')}
                options={[
                  { id: 'rect', label: t('Rectangular') },
                  { id: 'oval', label: t('Oval / natural') },
                ]}
                value={form.shape}
                onChange={(v) => set('shape', v)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('Max length')}>
              <input
                value={form.length}
                onChange={(e) => set('length', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            <Field label={t('Max width')}>
              <input
                value={form.width}
                onChange={(e) => set('width', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            <Field label={t('Average depth')}>
              <input
                value={form.depth}
                onChange={(e) => set('depth', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div className={`${panelCls} space-y-3`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Volume')}
          </h2>
          {volumeM3 === null ? (
            <p className="text-sm text-slate-500">
              {t('Enter the pond dimensions to see the volume.')}
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('Cubic metres')}</dt>
                <dd className="font-semibold">{f(volumeM3)} m³</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('Litres')}</dt>
                <dd className="font-semibold">{f0(litres!)} L</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('US gallons')}</dt>
                <dd className="font-semibold">{f0(gallons!)} gal</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                <dt className="text-slate-500">{t('Liner size (incl. ~60 cm overlap)')}</dt>
                <dd className="font-semibold">{f(linerM2!, 1)} m²</dd>
              </div>
            </dl>
          )}
          <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('Oval/natural shapes are estimated as an ellipse (≈78.5% of the rectangle). Average depth — not maximum — gives the honest volume.')}
          </p>
        </div>
      </div>
    </div>
  )
}
