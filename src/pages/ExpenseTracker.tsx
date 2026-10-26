import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Download, Loader2, Receipt, Trash2 } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { saveBlob } from '../lib/download'
import { loadXlsx } from './excel/shared'

const CATEGORIES = ['Meals', 'Travel', 'Supplies', 'Software', 'Office', 'Fuel', 'Other'] as const
const KEY = 'utility-hub.expenses.v1'

import { CURRENCY, LOCALE, fmtDate, fmtMoney } from '../utils/locale'

interface Entry {
  id: string
  vendor: string
  date: string
  amount: number
  category: string
  source?: string
}

const load = (): Entry[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export default function ExpenseTracker() {
  const [entries, setEntries] = useState<Entry[]>(load)
  const [preview, setPreview] = useState('')
  const [fileName, setFileName] = useState('')
  const [vendor, setVendor] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [exporting, setExporting] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(entries))
  }, [entries])

  const pickImage = useCallback((f: File) => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(f))
    setFileName(f.name)
  }, [preview])

  const addEntry = () => {
    const amt = parseFloat(amount)
    if (!vendor.trim() || isNaN(amt)) return
    setEntries((e) => [
      ...e,
      { id: crypto.randomUUID(), vendor: vendor.trim(), date, amount: amt, category, source: fileName || undefined },
    ])
    setVendor('')
    setAmount('')
    setCategory(CATEGORIES[0])
    setFileName('')
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const buildSheet = useCallback(async () => {
    const XLSX = await loadXlsx()
    const wb = XLSX.utils.book_new()
    const rows = [
      ['Vendor', 'Date', 'Amount', 'Category', 'Source image'],
      ...entries.map((e) => [e.vendor, e.date, e.amount, e.category, e.source ?? '']),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 28 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array
  }, [entries])

  const exportXlsx = async () => {
    setExporting(true)
    try {
      const bytes = await buildSheet()
      saveBlob(
        new Blob([bytes.slice()], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        'expenses.xlsx',
      )
    } finally {
      setExporting(false)
    }
  }

  const total = entries.reduce((s, e) => s + e.amount, 0)
  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Receipt &amp; Expense Tracker</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Snap or upload bills, log the details, and export a running Excel workbook — all on-device.
        Amounts display in your locale ({LOCALE}, {CURRENCY}).
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => cameraRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400">
              <Camera size={16} /> Scan bill
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])} />
          </div>
          <FilePicker accept="image/*" title="Or drop a receipt photo" icon={Receipt}
            onFiles={(files) => files[0] && pickImage(files[0])} />
          {preview && (
            <img src={preview} alt="Receipt preview"
              className="mt-3 max-h-44 rounded-lg border border-slate-200 object-contain dark:border-slate-800" />
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Vendor" className={input} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={`Amount (${CURRENCY})`} className={input} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="button" onClick={addEntry} disabled={!vendor.trim() || !amount}
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-40">
            Add expense
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
              <span className="ml-2 text-sky-600 dark:text-sky-400">Total {fmtMoney(total)}</span>
            </p>
            <span className="flex gap-1">
              <button type="button" onClick={() => void exportXlsx()} disabled={!entries.length || exporting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800">
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Excel
              </button>
              <ShareButton disabled={!entries.length}
                payload={async () => {
                  const bytes = await buildSheet()
                  return {
                    kind: 'file',
                    file: new File([bytes.slice()], 'expenses.xlsx', {
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    }),
                  }
                }} />
            </span>
          </div>
          <div className="mt-3 max-h-80 overflow-auto">
            {entries.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">No expenses yet — scan or add your first bill.</p>
            )}
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-3 border-b border-slate-200 py-2 text-sm last:border-0 dark:border-slate-800">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.vendor}</p>
                  <p className="text-xs text-slate-500">{fmtDate(e.date + 'T00:00')} · {e.category}</p>
                </div>
                <span className="font-mono text-sm tabular-nums">{fmtMoney(e.amount)}</span>
                <button type="button" aria-label="Delete entry"
                  onClick={() => setEntries((x) => x.filter((y) => y.id !== e.id))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
