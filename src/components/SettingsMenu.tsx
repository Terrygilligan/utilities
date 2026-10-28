import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { setToursEnabled, toursEnabled } from '../lib/updates'
import { t } from '../utils/i18n'

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [announcements, setAnnouncements] = useState(toursEnabled)

  const toggle = () => {
    const next = !announcements
    setAnnouncements(next)
    setToursEnabled(next)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
      >
        <Settings size={12} />
        {t('Settings')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-left dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold">{t('Settings')}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('Close')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('Preferences')}
            </p>
            <div className="mt-2 flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t('Show feature update announcements')}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={announcements}
                aria-label={t('Show feature update announcements')}
                onClick={toggle}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  announcements ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    announcements ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg text-xs text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
