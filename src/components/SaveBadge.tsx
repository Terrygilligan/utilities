import { Check, Loader2 } from 'lucide-react'
import type { SaveState } from '../lib/persist'
import { t } from '../utils/i18n'

export default function SaveBadge({ state }: { state: SaveState }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400 print:hidden">
      {state === 'saving' ? (
        <>
          <Loader2 size={12} className="animate-spin" /> {t('Saving…')}
        </>
      ) : (
        <>
          <Check size={12} className="text-emerald-500" /> {t('Saved locally')}
        </>
      )}
    </span>
  )
}
