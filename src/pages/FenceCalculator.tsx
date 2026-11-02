import SaveBadge from '../components/SaveBadge'
import Segmented from '../components/Segmented'
import { Field, cardCls, inputCls, panelCls } from '../components/ui'
import { usePersistentState } from '../lib/persist'
import { t } from '../utils/i18n'
import { fmtNumber } from '../utils/locale'

const KEY = 'utility-hub.fence.v1'

interface Form {
  length: string
  unit: 'm' | 'ft'
  spacing: string
  rails: '2' | '3' | '4'
  gates: string
  bagsPerPost: '0' | '1' | '2'
}

const DEFAULTS: Form = {
  length: '50',
  unit: 'm',
  spacing: '2.5',
  rails: '3',
  gates: '1',
  bagsPerPost: '1',
}

const num = (s: string) => {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

export default function FenceCalculator() {
  const [form, setForm, saveState] = usePersistentState<Form>(KEY, DEFAULTS)
  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const length = num(form.length)
  const spacing = num(form.spacing)
  const gates = num(form.gates) ?? 0
  const railsPerSection = Number(form.rails)
  const bagsPerPost = Number(form.bagsPerPost)

  const sections =
    length === null || spacing === null || length <= 0 || spacing <= 0
      ? null
      : Math.ceil(length / spacing)
  const posts = sections === null ? null : sections + 1 + gates * 2
  const railBoards = sections === null ? null : sections * railsPerSection
  const concreteBags = posts === null ? null : posts * bagsPerPost
  const postSpacingReal =
    sections === null || length === null ? null : length / sections

  const f = (n: number, digits = 1) =>
    fmtNumber(n, { maximumFractionDigits: digits })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Fence Materials Calculator')}
        </h1>
        <SaveBadge state={saveState} />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Posts, rails and post-hole concrete for a post-and-rail or wire fence — works in metres or feet.',
        )}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} space-y-4`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Fence line')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Total length')}>
              <input
                value={form.length}
                onChange={(e) => set('length', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
              <Segmented
                ariaLabel={t('Length unit')}
                options={[
                  { id: 'm', label: 'm' },
                  { id: 'ft', label: 'ft' },
                ]}
                value={form.unit}
                onChange={(v) => set('unit', v)}
              />
            </Field>
            <Field label={t('Post spacing')}>
              <input
                value={form.spacing}
                onChange={(e) => set('spacing', e.target.value)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('Rails per section')}>
              <Segmented
                ariaLabel={t('Rails per section')}
                options={[
                  { id: '2', label: '2' },
                  { id: '3', label: '3' },
                  { id: '4', label: '4' },
                ]}
                value={form.rails}
                onChange={(v) => set('rails', v)}
              />
            </Field>
            <Field label={t('Gates')}>
              <input
                value={form.gates}
                onChange={(e) => set('gates', e.target.value)}
                inputMode="numeric"
                className={inputCls}
              />
            </Field>
            <Field label={t('Concrete bags / post')}>
              <Segmented
                ariaLabel={t('Concrete bags / post')}
                options={[
                  { id: '0', label: '0' },
                  { id: '1', label: '1' },
                  { id: '2', label: '2' },
                ]}
                value={form.bagsPerPost}
                onChange={(v) => set('bagsPerPost', v)}
              />
            </Field>
          </div>
        </div>

        <div className={`${panelCls} space-y-3`}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('Materials needed')}
          </h2>
          {posts === null ? (
            <p className="text-sm text-slate-500">
              {t('Enter a length and spacing to see quantities.')}
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('Posts (incl. gate posts)')}</dt>
                <dd className="font-semibold">{f(posts, 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('Fence sections')}</dt>
                <dd className="font-semibold">{f(sections!, 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('Actual post spacing')}</dt>
                <dd className="font-semibold">
                  {f(postSpacingReal!, 2)} {form.unit}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  {t('Rails / boards ({n} per section)', { n: railsPerSection })}
                </dt>
                <dd className="font-semibold">{f(railBoards!, 0)}</dd>
              </div>
              {bagsPerPost > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t('Concrete bags (20–25 kg)')}</dt>
                  <dd className="font-semibold">{f(concreteBags!, 0)}</dd>
                </div>
              )}
            </dl>
          )}
          <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('Each gate adds two heavier gate posts. Add ~10% extra for cuts and breakages.')}
          </p>
        </div>
      </div>
    </div>
  )
}
