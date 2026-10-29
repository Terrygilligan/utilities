import { Waves } from 'lucide-react'
import SaveBadge from '../components/SaveBadge'
import Segmented from '../components/Segmented'
import { Field, cardCls, inputCls, panelCls } from '../components/ui'
import { usePersistentState } from '../lib/persist'
import { t } from '../utils/i18n'
import { fmtNumber } from '../utils/locale'

const KEY = 'utility-hub.swale.v1'

interface Form {
  drop: string
  dropUnit: 'cm' | 'm'
  distance: string
  length: string
  topWidth: string
  bottomWidth: string
  depth: string
}

const DEFAULTS: Form = {
  drop: '50',
  dropUnit: 'cm',
  distance: '20',
  length: '10',
  topWidth: '60',
  bottomWidth: '30',
  depth: '30',
}

const num = (s: string) => {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

export default function SwaleGradient() {
  const [form, setForm, saveState] = usePersistentState<Form>(KEY, DEFAULTS)
  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const drop = num(form.drop)
  const distance = num(form.distance)
  const length = num(form.length)
  const topW = num(form.topWidth)
  const bottomW = num(form.bottomWidth)
  const depth = num(form.depth)

  const dropM = drop === null ? null : drop * (form.dropUnit === 'cm' ? 0.01 : 1)
  const slopePct =
    dropM === null || distance === null || distance <= 0
      ? null
      : (dropM / distance) * 100
  const ratio =
    dropM === null || dropM <= 0 || distance === null ? null : distance / dropM

  const crossAreaM2 =
    topW === null || bottomW === null || depth === null
      ? null
      : ((topW / 100 + bottomW / 100) / 2) * (depth / 100)

  const volumeM3 =
    crossAreaM2 === null || length === null ? null : crossAreaM2 * length
  const spoilTonnes = volumeM3 === null ? null : volumeM3 * 1.6

  const f = (n: number, digits = 2) => fmtNumber(n, { maximumFractionDigits: digits })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Swale & Gradient Calculator')}
        </h1>
        <SaveBadge state={saveState} />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Slope percentage, 1:X ratio, and excavation volume for trapezoid swale trenches.')}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} space-y-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Slope')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Elevation drop')}>
              <input
                value={form.drop}
                onChange={(e) => set('drop', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
              <Segmented
                ariaLabel={t('Drop unit')}
                options={[
                  { id: 'cm', label: 'cm' },
                  { id: 'm', label: 'm' },
                ]}
                value={form.dropUnit}
                onChange={(v) => set('dropUnit', v)}
              />
            </Field>
            <Field label={t('Horizontal distance (m)')}>
              <input
                value={form.distance}
                onChange={(e) => set('distance', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
          </div>
          <h2 className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Swale trench')}
          </h2>
          <Field label={t('Trench length (m)')}>
            <input
              value={form.length}
              onChange={(e) => set('length', e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('Top width (cm)')}>
              <input
                value={form.topWidth}
                onChange={(e) => set('topWidth', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            <Field label={t('Bottom width (cm)')}>
              <input
                value={form.bottomWidth}
                onChange={(e) => set('bottomWidth', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            <Field label={t('Depth (cm)')}>
              <input
                value={form.depth}
                onChange={(e) => set('depth', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div className={`${cardCls} space-y-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Results')}
          </h2>

          <div className={panelCls}>
            <p className="text-xs text-slate-500">{t('Slope')}</p>
            <p className="mt-1 text-3xl font-bold text-sky-600 dark:text-sky-400">
              {slopePct === null ? '—' : `${f(slopePct)}%`}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {ratio === null ? '—' : `1 : ${f(ratio, 1)}`}
            </p>
          </div>

          <div className={panelCls}>
            <p className="text-xs text-slate-500">{t('Excavation volume')}</p>
            <p className="mt-1 text-3xl font-bold text-sky-600 dark:text-sky-400">
              {volumeM3 === null ? '—' : `${f(volumeM3)} m³`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {spoilTonnes === null
                ? ''
                : `≈ ${f(spoilTonnes, 1)} t ${t('of spoil (before bulking)')}`}
            </p>
          </div>

          <div className="space-y-1.5 font-mono text-sm">
            <p className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>{t('Cross-section area')}</span>
              <b className="text-sky-600 dark:text-sky-400">
                {crossAreaM2 === null ? '—' : `${f(crossAreaM2)} m²`}
              </b>
            </p>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Waves size={13} />
            {t('Swales are usually dug on contour (≈0% slope); check the ratio before committing to a line.')}
          </p>
        </div>
      </div>
    </div>
  )
}
