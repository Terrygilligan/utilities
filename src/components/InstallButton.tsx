import { useState } from 'react'
import { Download } from 'lucide-react'
import { useInstallPrompt } from '../lib/install'
import { t } from '../utils/i18n'

export default function InstallButton() {
  const [available, install] = useInstallPrompt()
  const [hint, setHint] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (available) {
      void install()
    } else {
      setHint((h) => !h)
    }
  }

  return (
    <span className="inline-flex flex-col items-center gap-1.5">
      <a
        href="/manifest.webmanifest"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-2 text-xs font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400"
      >
        <Download size={14} />
        {t('Add to Home Screen')}
      </a>
      {hint && (
        <span className="max-w-56 text-[11px] text-slate-500">
          {available ||
            t('On mobile: browser menu → "Add to Home Screen". On desktop: install icon in the address bar.')}
        </span>
      )}
    </span>
  )
}
