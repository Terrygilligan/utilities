import { useCallback, useRef, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2, Plus, Trash2, TriangleAlert, Upload, X } from 'lucide-react'
import FilePicker from '../../components/FilePicker'
import ShareButton from '../../components/ShareButton'
import { saveBlob, baseName } from '../../lib/download'
import { fmtBytes } from '../../utils/locale'
import { loadXlsx } from './shared'

const CSV_ACCEPT = '.csv,text/csv'

interface CsvFile {
  id: string
  file: File
}

const isCsv = (file: File) =>
  file.type === 'text/csv' || /\.csv$/i.test(file.name)

const sheetNameFor = (fileName: string, taken: Set<string>) => {
  const base = baseName(fileName).replace(/[[\]:*?/\\]/g, '').slice(0, 31) || 'Sheet'
  let name = base
  for (let suffix = 2; taken.has(name); suffix++) {
    name = `${base.slice(0, 28)} (${suffix})`
  }
  taken.add(name)
  return name
}

export default function CsvToXlsx() {
  const [files, setFiles] = useState<CsvFile[]>([])
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextIdRef = useRef(0)

  const addFiles = useCallback((incoming: File[]) => {
    const csv = incoming.filter(isCsv)
    if (csv.length < incoming.length) {
      setError(`Skipped ${incoming.length - csv.length} non-CSV file(s).`)
    } else {
      setError(null)
    }
    setFiles((current) => [
      ...current,
      ...csv.map((file) => ({ id: `csv-${nextIdRef.current++}`, file })),
    ])
  }, [])

  const buildWorkbookBytes = useCallback(async () => {
    if (files.length === 0) return null
    try {
      const XLSX = await loadXlsx()
      const workbook = XLSX.utils.book_new()
      const taken = new Set<string>()

      for (const { file } of files) {
        const text = await file.text()
        const parsed = XLSX.read(text, { type: 'string' })
        const sheet = parsed.Sheets[parsed.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: '',
        })
        const widths = new Map<number, number>()
        for (const row of rows) {
          row.forEach((cell, columnIndex) => {
            const length = String(cell ?? '').length
            if (length > (widths.get(columnIndex) ?? 0)) widths.set(columnIndex, length)
          })
        }
        sheet['!cols'] = Array.from(
          { length: widths.size },
          (_, columnIndex) => ({
            wch: Math.min(60, Math.max(8, (widths.get(columnIndex) ?? 8) + 2)),
          }),
        )
        XLSX.utils.book_append_sheet(workbook, sheet, sheetNameFor(file.name, taken))
      }

      return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array
    } catch {
      setError('Could not build the workbook — one of the CSV files may be malformed.')
      return null
    }
  }, [files])

  const workbookName = files.length === 1
    ? `${baseName(files[0].file.name)}.xlsx`
    : 'workbook.xlsx'

  const buildWorkbook = useCallback(async () => {
    setBuilding(true)
    setError(null)
    try {
      const bytes = await buildWorkbookBytes()
      if (bytes) {
        saveBlob(
          new Blob([bytes.slice()], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
          workbookName,
        )
      }
    } finally {
      setBuilding(false)
    }
  }, [buildWorkbookBytes, workbookName])

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <TriangleAlert size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <FilePicker
        accept={CSV_ACCEPT}
        multiple
        onFiles={addFiles}
        title="Drop CSV files here or click to browse"
        subtitle="Each file becomes a sheet in the workbook · processed on-device"
        icon={Upload}
      />

      {files.length > 0 && (
        <div className="mt-4 space-y-4">
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {files.map(({ id, file }) => (
              <li key={id} className="flex items-center gap-3 px-4 py-2.5">
                <FileSpreadsheet size={18} className="shrink-0 text-sky-600 dark:text-sky-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {fmtBytes(file.size)} → sheet “
                    {baseName(file.name).replace(/[[\]:*?/\\]/g, '').slice(0, 31)}”
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((current) => current.filter((entry) => entry.id !== id))
                  }
                  aria-label={`Remove ${file.name}`}
                  className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-300"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
            <li>
              <label
                htmlFor="csv-more-input"
                className="flex cursor-pointer items-center justify-center gap-2 px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-400 transition hover:text-slate-200"
              >
                <Plus size={14} />
                Add more CSV files
                <input
                  id="csv-more-input"
                  type="file"
                  accept={CSV_ACCEPT}
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    addFiles(Array.from(event.target.files ?? []))
                    event.target.value = ''
                  }}
                />
              </label>
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {files.length} file{files.length === 1 ? '' : 's'} → {files.length} sheet
              {files.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            >
              <Trash2 size={16} />
              Clear
            </button>
            <button
              type="button"
              onClick={() => void buildWorkbook()}
              disabled={building}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {building ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              {building ? 'Building…' : 'Create & download XLSX'}
            </button>
            <ShareButton
              disabled={files.length === 0}
              payload={async () => {
                const bytes = await buildWorkbookBytes()
                return bytes
                  ? {
                      kind: 'file',
                      file: new File([bytes.slice()], workbookName, {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
