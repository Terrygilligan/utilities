import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import FeatureTourModal from './FeatureTourModal'
import {
  APP_VERSION,
  getLastSeenVersion,
  isNewerVersion,
  setLastSeenVersion,
  toursEnabled,
} from '../lib/updates'
import { t } from '../utils/i18n'

export default function UpdateBanner() {
  const [visible, setVisible] = useState(
    () => toursEnabled() && isNewerVersion(APP_VERSION, getLastSeenVersion()),
  )
  const [tourOpen, setTourOpen] = useState(false)

  const dismiss = () => {
    setLastSeenVersion()
    setVisible(false)
  }

  return (
    <>
      {visible && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-300">
            <Sparkles size={16} className="shrink-0" />
            {t('What\'s new in')} v{APP_VERSION}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-500/25 dark:text-sky-300"
            >
              {t('Take Tour')}
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t('Dismiss')}
              title={t('Dismiss')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {tourOpen && <FeatureTourModal onClose={() => { setTourOpen(false); dismiss() }} />}
    </>
  )
}
