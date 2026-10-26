import { useCallback, useState } from 'react'
import type { WorkBook } from 'xlsx'
import type { PDFPage } from 'pdf-lib'
import { FileDown, FileSpreadsheet, FileUp, Loader2, TriangleAlert, Upload } from 'lucide-react'
import FilePicker from '../../components/FilePicker'
import ShareButton from '../../components/ShareButton'
import { saveBlob, baseName } from '../../lib/download'
import { fmtBytes } from '../../utils/locale'
import {
  SPREADSHEET_ACCEPT,
  isSpreadsheet,
  openWorkbook,
  sheetRows,
  sheetSelectClass,
} from './shared'

const PREVIEW_CAP = 500

const clean = (value: string) =>
  value.replace(/\s+/g, ' ').replace(/[^ -ÿ]/g, '').slice(0, 120)

async function rowsToPdfBlob(rows: string[][], title: string): Promise<Blob | null> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const PAGE_W = 842
  const PAGE_H = 595
  const MARGIN = 36
  const PAD_X = 6
  const FONT_SIZE = 8.5
  const TITLE_SIZE = 12
  const ROW_H = FONT_SIZE + 10

  const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
  if (colCount === 0) return null

  const colWidths = new Array<number>(colCount).fill(48)
  for (const row of rows) {
    for (let c = 0; c < colCount; c++) {
      const width = font.widthOfTextAtSize(clean(row[c] ?? ''), FONT_SIZE) + PAD_X * 2
      if (width > colWidths[c]) colWidths[c] = Math.min(220, width)
    }
  }
  const usable = PAGE_W - MARGIN * 2
  const total = colWidths.reduce((sum, w) => sum + w, 0)
  if (total > usable) {
    const factor = usable / total
    for (let c = 0; c < colCount; c++) colWidths[c] = Math.max(28, colWidths[c] * factor)
  }
  const gridWidth = colWidths.reduce((sum, w) => sum + w, 0)

  const header = rows[0] ?? []
  const body = rows.slice(1)

  let page = doc.addPage([PAGE_W, PAGE_H])
  let top = PAGE_H - MARGIN

  page.drawText(clean(title), {
    x: MARGIN,
    y: top - TITLE_SIZE,
    size: TITLE_SIZE,
    font: bold,
    color: rgb(0.05, 0.09, 0.16),
  })
  top -= TITLE_SIZE + 12

  const emitRow = (target: PDFPage, row: string[], isHeader: boolean, zebra: boolean) => {
    if (isHeader || zebra) {
      target.drawRectangle({
        x: MARGIN,
        y: top - ROW_H,
        width: gridWidth,
        height: ROW_H,
        color: isHeader ? rgb(0.87, 0.9, 0.93) : rgb(0.95, 0.96, 0.98),
      })
    }
    let x = MARGIN
    const activeFont = isHeader ? bold : font
    for (let c = 0; c < colCount; c++) {
      const cellWidth = colWidths[c]
      let text = clean(row[c] ?? '')
      while (text && activeFont.widthOfTextAtSize(text, FONT_SIZE) > cellWidth - PAD_X * 2) {
        text = text.slice(0, -2)
      }
      if (text) {
        target.drawText(text, {
          x: x + PAD_X,
          y: top - ROW_H + 7,
          size: FONT_SIZE,
          font: activeFont,
          color: isHeader ? rgb(0.05, 0.09, 0.16) : rgb(0.18, 0.23, 0.31),
        })
      }
      x += cellWidth
    }
    top -= ROW_H
  }

  emitRow(page, header, true, false)
  body.forEach((row, index) => {
    if (top - ROW_H < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H])
      top = PAGE_H - MARGIN
      emitRow(page, header, true, false)
    }
    emitRow(page, row, false, index % 2 === 0)
  })

  const bytes = await doc.save()
  return new Blob([bytes.slice()], { type: 'application/pdf' })
}

export default function SheetPreview() {
  const [file, setFile] = useState<File | null>(null)
  const [workbook, setWorkbook] = useState<WorkBook | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState('')
  const [rows, setRows] = useState<string[][]>([])
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const showSheet = useCallback(async (wb: WorkBook, name: string) => {
    setActiveSheet(name)
    setRows(await sheetRows(wb, name))
  }, [])

  const acceptFile = useCallback(
    async (files: File[]) => {
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
        setSheetNames(wb.SheetNames)
        await showSheet(wb, wb.SheetNames[0])
      } catch {
        setError('Could not read that spreadsheet — it may be corrupted or password-protected.')
        setFile(null)
        setWorkbook(null)
      } finally {
        setParsing(false)
      }
    },
    [showSheet],
  )

  const downloadPdf = useCallback(async () => {
    if (!file || rows.length === 0) return
    setExporting(true)
    setError(null)
    try {
      const blob = await rowsToPdfBlob(rows, `${baseName(file.name)} — ${activeSheet}`)
      if (blob) saveBlob(blob, `${baseName(file.name)}-${activeSheet}.pdf`)
      else setError('Nothing to export — the sheet is empty.')
    } catch {
      setError('Could not generate the PDF.')
    } finally {
      setExporting(false)
    }
  }, [file, rows, activeSheet])

  const header = rows[0] ?? []
  const body = rows.slice(1, PREVIEW_CAP + 1)

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
          subtitle={parsing ? 'Reading…' : '.xlsx, .xls, .xlsm or .ods · processed on-device'}
          icon={Upload}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <FileSpreadsheet size={20} className="shrink-0 text-sky-600 dark:text-sky-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-slate-500">
                {fmtBytes(file.size)} · {sheetNames.length} sheet
                {sheetNames.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {sheetNames.length > 1 && (
                <select
                  value={activeSheet}
                  onChange={(event) => {
                    if (workbook) void showSheet(workbook, event.target.value)
                  }}
                  aria-label="Active sheet"
                  className={sheetSelectClass()}
                >
                  {sheetNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
              <label
                htmlFor="xlsx-preview-input"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <FileUp size={15} />
                <span className="hidden sm:inline">Open a different file</span>
                <span className="sm:hidden">Change</span>
              </label>
              <input
                id="xlsx-preview-input"
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
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {rows.length} row{rows.length === 1 ? '' : 's'} · sheet “{activeSheet}”
            </span>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={exporting || rows.length === 0}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              {exporting ? 'Building…' : 'Download as PDF'}
            </button>
            <ShareButton
              disabled={exporting || rows.length === 0}
              payload={async () => {
                if (!file || rows.length === 0) return null
                const blob = await rowsToPdfBlob(
                  rows,
                  `${baseName(file.name)} — ${activeSheet}`,
                )
                return blob
                  ? {
                      kind: 'file',
                      file: new File([blob], `${baseName(file.name)}-${activeSheet}.pdf`, {
                        type: 'application/pdf',
                      }),
                    }
                  : null
              }}
            />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 text-center text-sm text-slate-500">
              This sheet is empty.
            </div>
          ) : (
            <>
              <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                    <tr>
                      {header.map((cell, index) => (
                        <th
                          key={index}
                          className="whitespace-nowrap border-b border-slate-300 dark:border-slate-700 px-3 py-2 font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="odd:bg-slate-900/60 even:bg-slate-800/30 transition-colors hover:bg-sky-500/5"
                      >
                        {Array.from({ length: header.length }, (_, cellIndex) => {
                          const cell = row[cellIndex] ?? ''
                          return (
                            <td
                              key={cellIndex}
                              title={cell}
                              className="max-w-60 truncate border-b border-slate-200 dark:border-slate-800/60 px-3 py-1.5 text-slate-700 dark:text-slate-300"
                            >
                              {cell}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length - 1 > PREVIEW_CAP && (
                <p className="text-xs text-slate-500">
                  Preview capped at the first {PREVIEW_CAP} rows — the PDF export
                  includes all {rows.length - 1}.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
