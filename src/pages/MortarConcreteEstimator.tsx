import { BrickWall } from 'lucide-react'
import SaveBadge from '../components/SaveBadge'
import Segmented from '../components/Segmented'
import { Field, cardCls, inputCls, panelCls } from '../components/ui'
import { usePersistentState } from '../lib/persist'
import { t } from '../utils/i18n'
import { fmtNumber } from '../utils/locale'

const KEY = 'utility-hub.mix-estimator.v1'
const BAG_KG = 25

interface Form {
  project: 'lime' | 'concrete' | 'screed'
  limeRatio: '2.5' | '3'
  mode: 'volume' | 'dims'
  volume: string
  length: string
  height: string
  thickness: string
  wastage: boolean
}

const DEFAULTS: Form = {
  project: 'lime',
  limeRatio: '2.5',
  mode: 'volume',
  volume: '1',
  length: '5',
  height: '2',
  thickness: '20',
  wastage: true,
}

const num = (s: string) => {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

export default function MortarConcreteEstimator() {
  const [form, setForm, saveState] = usePersistentState<Form>(KEY, DEFAULTS)
  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const wetVolume =
    form.mode === 'volume'
      ? num(form.volume)
      : (() => {
          const l = num(form.length)
          const h = num(form.height)
          const th = num(form.thickness)
          return l === null || h === null || th === null ? null : l * h * (th / 1000)
        })()

  const target = wetVolume === null ? null : wetVolume * (form.wastage ? 1.1 : 1)

  const limeParts = form.limeRatio === '2.5' ? 2.5 : 3
  const mix =
    form.project === 'lime'
      ? { binder: t('NHL 3.5 lime'), binderDensity: 900, parts: [1, limeParts, 0], dry: 1.33 }
      : form.project === 'concrete'
        ? { binder: t('Cement'), binderDensity: 1440, parts: [1, 2, 3], dry: 1.54 }
        : { binder: t('Cement'), binderDensity: 1440, parts: [1, 4, 0], dry: 1.33 }

  const total = mix.parts[0] + mix.parts[1] + mix.parts[2]
  const dryVolume = target === null ? null : target * mix.dry
  const binderM3 = dryVolume === null ? null : (dryVolume * mix.parts[0]) / total
  const sandM3 = dryVolume === null ? null : (dryVolume * mix.parts[1]) / total
  const gravelM3 =
    dryVolume === null || mix.parts[2] === 0 ? null : (dryVolume * mix.parts[2]) / total
  const binderKg = binderM3 === null ? null : binderM3 * mix.binderDensity
  const sandKg = sandM3 === null ? null : sandM3 * 1600
  const gravelKg = gravelM3 === null ? null : gravelM3 * 1650

  const bags = (kg: number | null) => (kg === null ? null : Math.ceil(kg / BAG_KG))
  const f = (n: number, digits = 2) => fmtNumber(n, { maximumFractionDigits: digits })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Lime & Concrete Mix Estimator')}
        </h1>
        <SaveBadge state={saveState} />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Binder, sand, and aggregate quantities for mortar, concrete, and screed — in bags and kg.')}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} space-y-4`}>
          <Field label={t('Project type')}>
            <select
              value={form.project}
              onChange={(e) => set('project', e.target.value as Form['project'])}
              className={inputCls}
            >
              <option value="lime">{t('Lime mortar (NHL 3.5)')}</option>
              <option value="concrete">{t('Structural concrete (1:2:3)')}</option>
              <option value="screed">{t('Screed / render (1:4)')}</option>
            </select>
          </Field>
          {form.project === 'lime' && (
            <Field label={t('Mix ratio (binder : sand)')}>
              <Segmented
                ariaLabel={t('Mix ratio')}
                options={[
                  { id: '2.5', label: '1 : 2.5' },
                  { id: '3', label: '1 : 3' },
                ]}
                value={form.limeRatio}
                onChange={(v) => set('limeRatio', v)}
              />
            </Field>
          )}
          <Field label={t('Volume input')}>
            <Segmented
              ariaLabel={t('Volume input')}
              options={[
                { id: 'volume', label: t('By volume') },
                { id: 'dims', label: t('By dimensions') },
              ]}
              value={form.mode}
              onChange={(v) => set('mode', v)}
            />
          </Field>
          {form.mode === 'volume' ? (
            <Field label={t('Target volume (m³)')}>
              <input
                value={form.volume}
                onChange={(e) => set('volume', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t('Length (m)')}>
                <input
                  value={form.length}
                  onChange={(e) => set('length', e.target.value)}
                  inputMode="decimal"
                  className={inputCls}
                />
              </Field>
              <Field label={t('Height (m)')}>
                <input
                  value={form.height}
                  onChange={(e) => set('height', e.target.value)}
                  inputMode="decimal"
                  className={inputCls}
                />
              </Field>
              <Field label={t('Thickness (mm)')}>
                <input
                  value={form.thickness}
                  onChange={(e) => set('thickness', e.target.value)}
                  inputMode="decimal"
                  className={inputCls}
                />
              </Field>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.wastage}
              onChange={(e) => set('wastage', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-sky-500"
            />
            {t('Add 10% wastage buffer')}
          </label>
        </div>

        <div className={`${cardCls} space-y-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Materials list')}
          </h2>

          <div className={panelCls}>
            <p className="text-xs text-slate-500">{t('Wet volume')}</p>
            <p className="mt-1 text-3xl font-bold text-sky-600 dark:text-sky-400">
              {target === null ? '—' : `${f(target)} m³`}
            </p>
            {form.wastage && wetVolume !== null && (
              <p className="mt-1 text-xs text-slate-500">
                {f(wetVolume)} m³ + 10% {t('wastage')}
              </p>
            )}
          </div>

          <div className="space-y-2 font-mono text-sm">
            <p className="flex flex-wrap justify-between gap-2 text-slate-700 dark:text-slate-300">
              <span>{mix.binder}</span>
              <b className="text-sky-600 dark:text-sky-400">
                {binderKg === null
                  ? '—'
                  : `${f(binderKg, 0)} kg · ${bags(binderKg)} × 25 kg ${t('bags')}`}
              </b>
            </p>
            <p className="flex flex-wrap justify-between gap-2 text-slate-700 dark:text-slate-300">
              <span>{t('Sand')}</span>
              <b className="text-sky-600 dark:text-sky-400">
                {sandM3 === null || sandKg === null
                  ? '—'
                  : `${f(sandM3)} m³ ≈ ${f(sandKg, 0)} kg (${bags(sandKg)} × 25 kg)`}
              </b>
            </p>
            {mix.parts[2] > 0 && (
              <p className="flex flex-wrap justify-between gap-2 text-slate-700 dark:text-slate-300">
                <span>{t('Gravel / aggregate')}</span>
                <b className="text-sky-600 dark:text-sky-400">
                  {gravelM3 === null || gravelKg === null
                    ? '—'
                    : `${f(gravelM3)} m³ ≈ ${f(gravelKg, 0)} kg (${bags(gravelKg)} × 25 kg)`}
                </b>
              </p>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-xs text-slate-500">
            <BrickWall size={13} className="mt-0.5 shrink-0" />
            {t('Includes dry-volume bulking (×1.33 mortar/screed, ×1.54 concrete). Densities: lime 900, cement 1440, sand 1600, gravel 1650 kg/m³.')}
          </p>
        </div>
      </div>
    </div>
  )
}
