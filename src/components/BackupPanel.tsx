import { useEffect, useState } from 'react'
import { HardDrive, Trash2, X } from 'lucide-react'
import { t } from '../utils/i18n'
import {
  clearAllData,
  requestPersistence,
  storageEstimate,
  storagePersisted,
} from '../lib/backup'

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export default function BackupPanel() {
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [persistDismissed, setPersistDismissed] = useState(false)

  useEffect(() => {
    void storagePersisted().then(setPersisted)
    void storageEstimate().then(setEstimate)
  }, [])

  const chip =
    'inline-flex items-center gap-1.5 rounded-lg bg-slate-500/15 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-500/25 dark:text-slate-300'

  const handleClear = () => {
    if (!window.confirm(t('Clear all app data on this device? This cannot be undone.'))) return
    if (!window.confirm(t('Really clear everything? This cannot be undone.'))) return
    clearAllData()
    window.location.reload()
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {persisted === false && !persistDismissed && (
          <>
            <button
              type="button"
              onClick={() => void requestPersistence().then(setPersisted)}
              title={t('Want to save your work locally? Ask the browser to keep app data on this device so it is not auto-cleared.')}
              className={chip}
            >
              <HardDrive size={14} />
              {t('Keep data on this device')}
            </button>
            <button
              type="button"
              onClick={() => setPersistDismissed(true)}
              aria-label={t('Dismiss')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-500/15 hover:text-slate-600 dark:text-slate-500"
            >
              <X size={14} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-red-500/10 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-300"
        >
          <Trash2 size={14} />
          {t('Clear data')}
        </button>
      </div>
      {estimate && (
        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
          {t('Storage')}: {formatBytes(estimate.usage)} / {formatBytes(estimate.quota)}
        </p>
      )}
    </div>
  )
}
