import { useEffect, useRef, useState } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import { t } from '../utils/i18n'
import {
  clearAllData,
  exportBackup,
  importBackup,
  lastBackupAt,
  requestPersistence,
  storageEstimate,
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
  const fileRef = useRef<HTMLInputElement>(null)
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [lastBackup, setLastBackup] = useState<string | null>(() => lastBackupAt())

  useEffect(() => {
    void requestPersistence()
    void storageEstimate().then(setEstimate)
  }, [])

  const chip =
    'inline-flex items-center gap-1.5 rounded-lg bg-slate-500/15 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-500/25 dark:text-slate-300'

  const handleExport = () => {
    try {
      exportBackup()
      setLastBackup(lastBackupAt())
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err))
    }
  }

  const handleImport = async (file: File) => {
    const confirmed = window.confirm(
      t(
        'Restore this backup? It replaces ALL current app data (notes, expenses, authenticator accounts, theme) with the file contents.',
      ),
    )
    if (!confirmed) return
    try {
      await importBackup(file)
      window.alert(t('Backup restored. The app will now reload.'))
      window.location.reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err))
    }
  }

  const handleClear = () => {
    if (!window.confirm(t('Clear all app data on this device? This cannot be undone.'))) return
    if (!window.confirm(t('Really clear everything? Export a backup first if you need one.'))) return
    clearAllData()
    window.location.reload()
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          title={t('Backup files contain authenticator secrets — store them safely')}
          className={chip}
        >
          <Download size={14} />
          {t('Export backup')}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={chip}>
          <Upload size={14} />
          {t('Restore backup')}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
        >
          <Trash2 size={14} />
          {t('Clear data')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void handleImport(file)
          }}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
        {t('Last backup')}: {lastBackup ? new Date(lastBackup).toLocaleDateString() : t('never')}
        {estimate && ` · ${t('Storage')}: ${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)}`}
      </p>
    </div>
  )
}
