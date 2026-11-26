import { useState } from 'react'
import { Scale, X } from 'lucide-react'
import { t } from '../utils/i18n'

export default function LegalNotice() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-600 underline-offset-2 transition hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Scale size={12} />
        {t('Legal Notice')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-left dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold">{t('Legal Notice')}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('Close')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('All tools are provided "as is", with no guarantee of accuracy, availability, or fitness for a particular purpose — implied or otherwise. Always verify important results (structural, financial, medical) independently.')}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg text-xs text-slate-600 transition hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
