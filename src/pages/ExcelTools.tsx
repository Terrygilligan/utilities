import { useState } from 'react'
import { FileSpreadsheet, Table2, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '../utils/i18n'
import SheetPreview from './excel/SheetPreview'
import XlsxToCsv from './excel/XlsxToCsv'
import CsvToXlsx from './excel/CsvToXlsx'

type TabId = 'preview' | 'to-csv' | 'to-xlsx'

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'preview', label: 'Preview & PDF', icon: Table2 },
  { id: 'to-csv', label: 'XLSX → CSV', icon: FileText },
  { id: 'to-xlsx', label: 'CSV → XLSX', icon: FileSpreadsheet },
]

export default function ExcelTools() {
  const [tab, setTab] = useState<TabId>('preview')

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Excel & CSV Tools')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Preview, convert, and build spreadsheets entirely on your device — files never leave this browser.')}
      </p>

      <div
        role="tablist"
        aria-label={t('Spreadsheet tools')}
        className="mt-6 flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition sm:text-sm ${
              tab === id
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon size={15} className="shrink-0" />
            <span className="truncate">{t(label)}</span>
          </button>
        ))}
      </div>

      <div className={tab === 'preview' ? 'mt-6' : 'hidden'}>
        <SheetPreview />
      </div>
      <div className={tab === 'to-csv' ? 'mt-6' : 'hidden'}>
        <XlsxToCsv />
      </div>
      <div className={tab === 'to-xlsx' ? 'mt-6' : 'hidden'}>
        <CsvToXlsx />
      </div>
    </div>
  )
}
