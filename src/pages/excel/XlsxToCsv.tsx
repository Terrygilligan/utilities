import { useCallback, useState } from 'react'
import type { WorkBook } from 'xlsx'
import { FileDown, FileSpreadsheet, FileUp, Loader2, TriangleAlert, Upload } from 'lucide-react'
import FilePicker from '../../components/FilePicker'
import ShareButton from '../../components/ShareButton'
import { saveBlob, baseName } from '../../lib/download'
import { fmtBytes } from '../../utils/locale'
import {
  SPREADSHEET_ACCEPT,
  isSpreadsheet,
  loadXlsx,
  openWorkbook,
  sheetSelectClass,
} from './shared'

export default function XlsxToCsv() {
  const [file, setFile] = useState<File | null>(null)
  const [workbook, setWorkbook] = useState<WorkBook | null>(null)
  const [activeSheet, setActiveSheet] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const acceptFile = useCallback(async (files: File[]) => {
    const candidate = files[0]
    if (!candidate) return
    if (!isSpreadsheet(candidate)) {
      setError('That file is not a spreadsheet — upload .xlsx, .xls, .xlsm or .ods.')
      return
    }
    setParsing(true)
    setError(null)
    try {
      const wb = await openWorkbook(candidate)
      setFile(candidate)
      setWorkbook(wb)
      setActiveSheet(wb.SheetNames[0])
    } catch {
      setError('Could not read that spreadsheet — it may be corrupted or password-protected.')
      setFile(null)
      setWorkbook(null)
    } finally {
      setParsing(false)
    }
  }, [])

  const makeCsvText = useCallback(async () => {
    if (!workbook || !activeSheet) return null
    const XLSX = await loadXlsx()
    return XLSX.utils.sheet_to_csv(workbook.Sheets[activeSheet])
  }, [workbook, activeSheet])

  const downloadCsv = useCallback(async () => {
    if (!file) return
    setExporting(true)
    setError(null)
    try {
      const csv = await makeCsvText()
      if (csv !== null)
        saveBlob(
          new Blob([csv], { type: 'text/csv;charset=utf-8' }),
          `${baseName(file.name)}-${activeSheet}.csv`,
        )
    } catch {
      setError('Could not convert that sheet to CSV.')
    } finally {
      setExporting(false)
    }
  }, [file, activeSheet, makeCsvText])

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <TriangleAlert size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {!file ? (
        <FilePicker
          accept={SPREADSHEET_ACCEPT}
          onFiles={(files) => void acceptFile(files)}
          title="Drop a spreadsheet here or click to browse"
          subtitle={parsing ? 'Reading…' : 'Each sheet can be exported as its own CSV'}
          icon={Upload}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <FileSpreadsheet size={20} className="shrink-0 text-sky-600 dark:text-sky-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-slate-500">
                {fmtBytes(file.size)} · {workbook?.SheetNames.length ?? 0} sheet
                {(workbook?.SheetNames.length ?? 0) === 1 ? '' : 's'}
              </p>
            </div>
            <label
              htmlFor="xlsx-csv-input"
              className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            >
              <FileUp size={15} />
              <span className="hidden sm:inline">Open a different file</span>
              <span className="sm:hidden">Change</span>
            </label>
            <input
              id="xlsx-csv-input"
              type="file"
              accept={SPREADSHEET_ACCEPT}
              className="sr-only"
              onChange={(event) => {
                const picked = event.target.files?.[0]
                if (picked) void acceptFile([picked])
                event.target.value = ''
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5">
            {(workbook?.SheetNames.length ?? 0) > 1 ? (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                Sheet
                <select
                  value={activeSheet}
                  onChange={(event) => setActiveSheet(event.target.value)}
                  className={sheetSelectClass()}
                >
                  {workbook?.SheetNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="text-sm text-slate-600 dark:text-slate-400">Sheet “{activeSheet}”</span>
            )}
            <button
              type="button"
              onClick={() => void downloadCsv()}
              disabled={exporting}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              Download CSV
            </button>
            <ShareButton
              payload={async () => {
                if (!file) return null
                const csv = await makeCsvText()
                return csv !== null
                  ? {
                      kind: 'file',
                      file: new File([csv], `${baseName(file.name)}-${activeSheet}.csv`, {
                        type: 'text/csv',
                      }),
                    }
                  : null
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
