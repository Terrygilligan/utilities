import { useState } from 'react'
import { Lightbulb, ShieldCheck, Star, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { setLastSeenVersion, setToursEnabled } from '../lib/updates'
import { t } from '../utils/i18n'

interface Step {
  icon: LucideIcon
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: Star,
    title: 'Dashboard Customization',
    body: 'Pin your favorite tools and reorder the dashboard cards — your layout is saved on this device.',
  },
  {
    icon: Lightbulb,
    title: 'Global Feedback',
    body: 'Report a bug or suggest a feature from the footer links on any page — they go straight to the fix queue.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    body: 'Look for the "Saved locally" badge — everything you enter stays on this device, in your browser.',
  },
]

interface FeatureTourModalProps {
  onClose: () => void
}

export default function FeatureTourModal({ onClose }: FeatureTourModalProps) {
  const [step, setStep] = useState(0)
  const [optOut, setOptOut] = useState(false)

  const finish = () => {
    if (optOut) setToursEnabled(false)
    setLastSeenVersion()
    setStep(0)
    onClose()
  }

  const last = step === STEPS.length - 1
  const Icon = STEPS[step].icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t('What\'s new')} · {step + 1} / {STEPS.length}
          </p>
          <button
            type="button"
            onClick={finish}
            aria-label={t('Close')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <Icon size={24} />
        </div>
        <p className="mt-4 text-base font-semibold">{t(STEPS[step].title)}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {t(STEPS[step].body)}
        </p>

        <div className="mt-5 flex justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 w-6 rounded-full transition ${
                i === step ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {last && (
          <label className="mt-5 flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
            <input
              type="checkbox"
              checked={optOut}
              onChange={(e) => setOptOut(e.target.checked)}
              className="h-4 w-4 accent-sky-500"
            />
            {t('Don\'t show update announcements in the future')}
          </label>
        )}

        <div className="mt-5 flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('Back')}
            </button>
          )}
          {last ? (
            <button
              type="button"
              onClick={finish}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-sky-500 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              {t('Done')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-sky-500 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              {t('Next')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
