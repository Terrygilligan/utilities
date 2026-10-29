import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Check, Download, FileText, Loader2, Pencil, Printer, Receipt, ScanText, Trash2, X } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { saveBlob } from '../lib/download'
import { loadXlsx } from './excel/shared'
import { CURRENCIES, fmtDate, fmtDateTime, fmtMoney, getCurrency } from '../utils/locale'
import { t } from '../utils/i18n'
import { CategoryDonut, CurrencyToggle, MonthlyBarChart } from './expenses/ExpenseCharts'

const CATEGORIES = [
  'Meals', 'Travel', 'Supplies', 'Software', 'Office', 'Fuel',
  'Maintenance', 'Cleaning Supplies', 'Utilities', 'Other',
] as const
const CUSTOM = '__custom'
const KEY = 'utility-hub.expenses.v1'

interface Entry {
  id: string
  vendor: string
  date: string
  amount: number
  currency: string
  category: string
  entity?: string
  notes?: string
  vatRate?: number
  source?: string
}

interface RawEntry extends Omit<Entry, 'currency'> {
  currency?: string
}

const load = (): Entry[] => {
  try {
    const rows = JSON.parse(localStorage.getItem(KEY) ?? '[]') as RawEntry[]
    const fallback = getCurrency()
    return rows.map((e) => ({ ...e, currency: e.currency ?? fallback }))
  } catch {
    return []
  }
}

const vatAmount = (e: Entry) =>
  e.vatRate ? e.amount - e.amount / (1 + e.vatRate / 100) : 0

const detectCurrency = (text: string): string | null => {
  if (/лв\.?|лева|\bbgn\b/i.test(text)) return 'EUR'
  const code = text.match(/\b(EUR|GBP|USD|CHF|RON|TRY|PLN|CZK|RSD|MKD|JPY|CAD|AUD)\b/i)
  if (code) return code[1].toUpperCase()
  if (text.includes('€')) return 'EUR'
  if (text.includes('£')) return 'GBP'
  if (text.includes('$')) return 'USD'
  return null
}

const preprocess = (file: File): Promise<HTMLCanvasElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const scale = Math.min(3, Math.max(1, 2000 / Math.max(img.width, img.height)))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      const ctx = c.getContext('2d')
      if (!ctx) return reject(new Error('no 2d context'))
      ctx.filter = 'grayscale(1) contrast(1.4)'
      ctx.drawImage(img, 0, 0, c.width, c.height)
      const d = ctx.getImageData(0, 0, c.width, c.height)
      const px = d.data
      let min = 255
      let max = 0
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] < min) min = px[i]
        if (px[i] > max) max = px[i]
      }
      const range = Math.max(1, max - min)
      for (let i = 0; i < px.length; i += 4) {
        const v = Math.round(((px[i] - min) / range) * 255)
        px[i] = px[i + 1] = px[i + 2] = v
      }
      ctx.putImageData(d, 0, 0)
      resolve(c)
    }
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = URL.createObjectURL(file)
  })

const emptyForm = () => ({
  vendor: '',
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  currency: getCurrency() as string,
  category: CATEGORIES[0] as string,
  customCategory: '',
  entity: '',
  notes: '',
  vatRate: '',
})

export default function ExpenseTracker() {
  const [entries, setEntries] = useState<Entry[]>(load)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [preview, setPreview] = useState('')
  const [fileName, setFileName] = useState('')
  const [exporting, setExporting] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<File | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [camOpen, setCamOpen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [ocrNote, setOcrNote] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [chartCurrency, setChartCurrency] = useState<string>(getCurrency)
  const [saveState, setSaveState] = useState<'saving' | 'saved'>('saved')

  useEffect(() => {
    setSaveState('saving')
    localStorage.setItem(KEY, JSON.stringify(entries))
    const timer = setTimeout(() => setSaveState('saved'), 800)
    return () => clearTimeout(timer)
  }, [entries])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const openCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      setCamOpen(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            void videoRef.current.play().catch(() => {})
          }
        })
      })
    } catch {
      cameraRef.current?.click()
    }
  }

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCamOpen(false)
  }

  const snap = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) pickImage(new File([blob], 'receipt-photo.jpg', { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.9,
    )
    stopCam()
  }

  const applyOcrText = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    const found: string[] = []
    const numRe = /\d+[.,]\d{2}/
    if (!form.vendor.trim()) {
      const headerRe = /(касов|фискал|фактура|сметка|документ|receipt|invoice|bill|еик|зддс|оператор|продажба)/i
      const businessRe = /(аптека|магазин|оод|еоод|\bет\b|\bад\b|pharmacy|shop|market|ltd)/i
      const candidates = lines
        .map((l) => l.replace(/^[^a-zA-Zа-яА-Я0-9]+/, '').replace(/[^a-zA-Zа-яА-Я0-9.\s-].*$/, '').trim())
        .filter((l) => /[a-zA-Zа-яА-Я]{3}/.test(l) && !headerRe.test(l) && !numRe.test(l))
      const vendor = candidates.find((l) => businessRe.test(l)) ?? candidates[0]
      if (vendor) {
        set({ vendor })
        found.push('vendor')
      }
    }
    const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
    const dmy = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/)
    const yearStr = iso ? iso[1] : dmy ? (dmy[3].length === 2 ? '20' + dmy[3] : dmy[3]) : null
    const year = yearStr ? parseInt(yearStr, 10) : 0
    const dateStr =
      iso && year >= 2000 && year <= 2099
        ? `${iso[1]}-${iso[2]}-${iso[3]}`
        : dmy && year >= 2000 && year <= 2099
          ? `${yearStr}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
          : null
    if (dateStr) {
      set({ date: dateStr })
      found.push('date')
    }
    const totalRe = /(total|amount due|grand|итог|общо|обш|су.а|дължим|платено|крайна)/i
    let amount = ''
    const totalLine = lines.find((l) => totalRe.test(l) && numRe.test(l))
    if (totalLine) {
      const nums = [...totalLine.matchAll(/\d+[.,]\d{2}/g)].map((m) =>
        parseFloat(m[0].replace(',', '.')),
      )
      amount = String(Math.max(...nums))
    } else {
      const marked = [
        ...text.matchAll(/(\d+[.,]\d{2})\s*(?:лв\.?|лева|bgn|eur|gbp|usd|chf|€|£|\$)/gi),
      ]
        .map((m) => parseFloat(m[1].replace(',', '.')))
        .filter((n) => n > 0 && n < 1_000_000)
      const all = marked.length
        ? marked
        : [...text.matchAll(/\d+[.,]\d{2}/g)]
            .map((m) => parseFloat(m[0].replace(',', '.')))
            .filter((n) => n > 0 && n < 1_000_000)
      if (all.length) amount = String(Math.max(...all))
    }
    if (amount && !form.amount) {
      set({ amount })
      found.push('amount')
    }
    const cur = detectCurrency(text)
    if (cur && cur !== form.currency) {
      set({ currency: cur })
      found.push(`currency ${cur}`)
    }
    return found
  }

  const ocrImage = async (file: File) => {
    setScanning(true)
    setOcrNote('')
    setOcrText('')
    try {
      const mod = await import('tesseract.js')
      const api = 'createWorker' in mod ? mod : (mod as { default?: typeof mod }).default
      if (!api) throw new Error('tesseract.js module shape not recognized')
      const worker = await api.createWorker(['eng', 'bul'], undefined, {
        workerPath: '/tess-worker/worker.min.js',
        corePath: '/tess-worker/tesseract-core-simd-lstm.wasm.js',
        langPath: '/tessdata',
      })
      await worker.setParameters({ tessedit_pageseg_mode: api.PSM.SPARSE_TEXT })
      const { data } = await worker.recognize(await preprocess(file))
      await worker.terminate()
      setOcrText(data.text)
      const found = applyOcrText(data.text)
      const fieldNames = found.map((f) =>
        f === 'vendor' ? t('vendor')
        : f === 'date' ? t('date')
        : f === 'amount' ? t('amount')
        : t('currency {code}', { code: f.slice(9) }))
      setOcrNote(
        found.length
          ? t('Auto-filled from scan: {fields} — check before saving.', { fields: fieldNames.join(', ') })
          : t('Scan finished — nothing recognized, fill the fields manually.'),
      )
    } catch (err) {
      console.error('OCR failed:', err)
      setOcrNote(t('Text scan failed — photo attached, fill the fields manually.'))
    } finally {
      setScanning(false)
    }
  }

  const pickImage = useCallback(
    (f: File) => {
      if (preview) URL.revokeObjectURL(preview)
      fileRef.current = f
      setPreview(URL.createObjectURL(f))
      setFileName(f.name)
      void ocrImage(f)
    },
    [preview],
  )

  const clearPreview = () => {
    fileRef.current = null
    setFileName('')
    setOcrNote('')
    setOcrText('')
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const set = (patch: Partial<ReturnType<typeof emptyForm>>) =>
    setForm((f) => ({ ...f, ...patch }))

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    clearPreview()
  }

  const saveEntry = () => {
    const amt = parseFloat(form.amount.replace(',', '.'))
    const category =
      form.category === CUSTOM ? form.customCategory.trim() : form.category
    const rate = form.vatRate ? parseFloat(form.vatRate.replace(',', '.')) : undefined
    if (!form.vendor.trim() || isNaN(amt) || !category) return
    const entry: Entry = {
      id: editingId ?? crypto.randomUUID(),
      vendor: form.vendor.trim(),
      date: form.date,
      amount: amt,
      currency: form.currency,
      category,
      entity: form.entity.trim() || undefined,
      notes: form.notes.trim() || undefined,
      vatRate: rate !== undefined && !isNaN(rate) && rate > 0 ? rate : undefined,
      source: fileName || undefined,
    }
    setEntries((list) =>
      editingId ? list.map((e) => (e.id === editingId ? entry : e)) : [...list, entry],
    )
    resetForm()
  }

  const startEdit = (e: Entry) => {
    setEditingId(e.id)
    const isCustom = !(CATEGORIES as readonly string[]).includes(e.category)
    setForm({
      vendor: e.vendor,
      date: e.date,
      amount: String(e.amount),
      currency: e.currency,
      category: isCustom ? CUSTOM : e.category,
      customCategory: isCustom ? e.category : '',
      entity: e.entity ?? '',
      notes: e.notes ?? '',
      vatRate: e.vatRate ? String(e.vatRate) : '',
    })
  }

  const buildSheet = useCallback(async () => {
    const XLSX = await loadXlsx()
    const wb = XLSX.utils.book_new()
    const rows = [
      [t('Vendor'), t('Date'), t('Amount'), t('Currency'), t('Category'), t('Entity'), t('VAT %'), t('VAT amount'), t('Notes'), t('Source image')],
      ...entries.map((e) => [
        e.vendor, e.date, e.amount, e.currency, e.category,
        e.entity ?? '', e.vatRate ?? '', e.vatRate ? vatAmount(e) : '',
        e.notes ?? '', e.source ?? '',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 9 }, { wch: 16 }, { wch: 12 }, { wch: 7 }, { wch: 11 }, { wch: 24 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, ws, t('Expenses'))

    const summaryRows: (string | number)[][] = [[t('Summary')], []]
    for (const [cur, total] of totalsByCurrency(entries)) {
      summaryRows.push([t('Total'), cur, Math.round(total * 100) / 100])
    }
    const allCurs = [...new Set([...CURRENCIES, ...entries.map((e) => e.currency)])]
    summaryRows.push([], [t('Month'), ...allCurs])
    for (const [month, map] of totalsByMonth(entries)) {
      summaryRows.push([month, ...allCurs.map((c) => Math.round((map.get(c) ?? 0) * 100) / 100)])
    }
    summaryRows.push([], [t('Category'), ...allCurs])
    for (const [cat, map] of totalsByCategory(entries)) {
      summaryRows.push([t(cat), ...allCurs.map((c) => Math.round((map.get(c) ?? 0) * 100) / 100)])
    }
    const sws = XLSX.utils.aoa_to_sheet(summaryRows)
    sws['!cols'] = [{ wch: 20 }, ...allCurs.map(() => ({ wch: 10 }))]
    XLSX.utils.book_append_sheet(wb, sws, t('Summary'))
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array
  }, [entries])

  const exportCsv = () => {
    const esc = (v: string | number) => {
      const s = String(v)
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows: (string | number)[][] = [
      [t('Date'), t('Vendor'), t('Amount'), t('Currency'), t('Category'), t('Entity'), t('VAT'), t('Notes')],
      ...entries.map((e) => [
        e.date,
        e.vendor,
        e.amount,
        e.currency,
        e.category,
        e.entity ?? '',
        e.vatRate ? Math.round(vatAmount(e) * 100) / 100 : '',
        e.notes ?? '',
      ]),
    ]
    const csv = String.fromCharCode(0xfeff) + rows.map((r) => r.map(esc).join(',')).join('\r\n')
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'expenses.csv')
  }

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

  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60'
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const curTotals = totalsByCurrency(entries)
  const monthTotals = totalsByMonth(entries)
  const catTotals = totalsByCategory(entries)
  const monthCount = Math.max(monthTotals.size, 1)
  const chartCur = curTotals.has(chartCurrency)
    ? chartCurrency
    : [...curTotals.keys()][0]
  const chartCurs = [...new Set([...CURRENCIES, ...curTotals.keys()])]
  const monthSeries = chartCur
    ? [...monthTotals]
        .map(([month, map]) => ({ month, total: map.get(chartCur) ?? 0 }))
        .filter((d) => d.total > 0)
        .sort((a, b) => a.month.localeCompare(b.month))
    : []
  const catSeries = chartCur
    ? [...catTotals]
        .map(([label, map]) => ({ label, total: map.get(chartCur) ?? 0 }))
        .filter((d) => d.total > 0)
    : []

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t('Receipt & Expense Tracker')}</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400 print:hidden">
          {saveState === 'saving' ? (
            <>
              <Loader2 size={12} className="animate-spin" /> {t('Saving…')}
            </>
          ) : (
            <>
              <Check size={12} className="text-emerald-500" /> {t('Saved locally')}
            </>
          )}
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Snap or upload bills, log the details, and export a running Excel workbook — all on-device. Each entry keeps its own currency; totals stay grouped per currency (no fake exchange rates).')}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 print:grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void openCam()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400">
              <Camera size={16} /> {t('Scan bill')}
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])} />
          </div>
          <FilePicker accept="image/*" title={t('Or drop a receipt photo')} icon={Receipt}
            onFiles={(files) => files[0] && pickImage(files[0])} />
          {camOpen && (
            <div className="mt-3 space-y-2">
              <video ref={videoRef} autoPlay playsInline muted
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800" />
              <div className="flex gap-2">
                <button type="button" onClick={snap}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-semibold text-white transition hover:bg-sky-400">
                  <Camera size={14} /> {t('Take photo')}
                </button>
                <button type="button" onClick={stopCam}
                  className="inline-flex h-9 items-center rounded-lg px-3 text-xs text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800">
                  {t('Cancel')}
                </button>
              </div>
            </div>
          )}
          {preview && (
            <div className="mt-3 space-y-2">
              <img src={preview} alt={t('Receipt preview')}
                className="max-h-44 rounded-lg border border-slate-200 object-contain dark:border-slate-800" />
              <div className="flex gap-2">
                <button type="button" disabled={scanning || !fileRef.current}
                  onClick={() => fileRef.current && void ocrImage(fileRef.current)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 text-xs font-semibold text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
                  {scanning ? <Loader2 size={14} className="animate-spin" /> : <ScanText size={14} />}
                  {scanning ? t('Processing receipt…') : t('Extract receipt data')}
                </button>
                <button type="button" onClick={clearPreview}
                  className="inline-flex h-9 items-center rounded-lg px-3 text-xs text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800">
                  {t('receipt.clear')}
                </button>
              </div>
            </div>
          )}
          {scanning && (
            <p className="mt-2 flex items-center gap-2 rounded-lg bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-700 dark:text-sky-400">
              <Loader2 size={13} className="animate-spin" /> {t('Processing receipt — extracting vendor, date and total…')}
            </p>
          )}
          {ocrNote && !scanning && (
            <p className="mt-2 text-xs text-slate-500">{ocrNote}</p>
          )}
          {ocrText && !scanning && (
            <details className="mt-2 text-xs text-slate-500">
              <summary className="cursor-pointer select-none">{t('View recognized text')}</summary>
              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-500/10 p-2">{ocrText}</pre>
            </details>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={form.vendor} onChange={(e) => set({ vendor: e.target.value })} placeholder={t('Vendor')} className={input} />
            <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} className={input} />
            <div className="flex gap-2">
              <input value={form.amount} onChange={(e) => set({ amount: e.target.value })} inputMode="decimal" placeholder={t('Amount')} className={input} />
              <select value={form.currency} onChange={(e) => set({ currency: e.target.value })}
                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                {!(CURRENCIES as readonly string[]).includes(form.currency) && (
                  <option value={form.currency}>{form.currency}</option>
                )}
              </select>
            </div>
            <select value={form.category} onChange={(e) => set({ category: e.target.value })} className={input}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
              <option value={CUSTOM}>{t('Custom…')}</option>
            </select>
            {form.category === CUSTOM && (
              <input value={form.customCategory} onChange={(e) => set({ customCategory: e.target.value })}
                placeholder={t('Custom category (e.g. {example})', { example: 'Домакинство' })} className={`${input} sm:col-span-2`} />
            )}
            <input value={form.entity} onChange={(e) => set({ entity: e.target.value })} placeholder={t('Entity (optional)')} className={input} />
            <input value={form.vatRate} onChange={(e) => set({ vatRate: e.target.value })} inputMode="decimal" placeholder={t('VAT % incl. (optional)')} className={input} />
            <input value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder={t('Notes (optional)')} className={`${input} sm:col-span-2`} />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={saveEntry}
              disabled={!form.vendor.trim() || !form.amount || (form.category === CUSTOM && !form.customCategory.trim())}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-40">
              {editingId ? t('Save changes') : t('Add expense')}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} aria-label={t('Cancel edit')}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800">
                <X size={14} /> {t('Cancel')}
              </button>
            )}
          </div>
        </div>

        <div className="print-sheet rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 print:border-0 print:p-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {entries.length} {entries.length === 1 ? t('entry') : t('entries')}
            </p>
            <span className="flex gap-1 print:hidden">
              <button type="button" onClick={() => window.print()} disabled={!entries.length}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800">
                <Printer size={14} /> {t('Print / PDF')}
              </button>
              <button type="button" onClick={exportCsv} disabled={!entries.length}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800">
                <FileText size={14} /> CSV
              </button>
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

          {entries.length > 0 && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {[...curTotals].map(([cur, total]) => (
                  <span key={cur} className="rounded-lg bg-sky-500/10 px-2 py-1 font-mono font-medium text-sky-700 dark:text-sky-400">
                    {fmtMoney(total, cur)}
                  </span>
                ))}
                <span className="rounded-lg bg-slate-500/10 px-2 py-1 text-slate-500">
                  {t('monthly avg {avg}', { avg: [...curTotals].map(([c, tot]) => fmtMoney(tot / monthCount, c)).join(' · ') })}
                </span>
              </div>
              {chartCur && (
                <div className="border-t border-slate-200 pt-3 dark:border-slate-800 print:hidden">
                  <CurrencyToggle
                    currencies={chartCurs}
                    available={new Set(curTotals.keys())}
                    value={chartCur}
                    onChange={setChartCurrency}
                  />
                  {monthSeries.length > 0 && (
                    <>
                      <p className="mt-3 mb-1 font-semibold text-slate-500">
                        {t('Monthly spend — {currency}', { currency: chartCur })}
                      </p>
                      <MonthlyBarChart data={monthSeries} currency={chartCur} />
                    </>
                  )}
                  {catSeries.length > 0 && (
                    <>
                      <p className="mt-3 mb-1 font-semibold text-slate-500">
                        {t('By category — {currency}', { currency: chartCur })}
                      </p>
                      <CategoryDonut data={catSeries} currency={chartCur} />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 max-h-80 overflow-auto print:hidden">
            {entries.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">{t('No expenses yet — scan or add your first bill.')}</p>
            )}
            {sorted.map((e) => (
              <div key={e.id} className="flex items-center gap-3 border-b border-slate-200 py-2 text-sm last:border-0 dark:border-slate-800">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {e.vendor}
                    {e.entity && <span className="ml-1.5 rounded bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{e.entity}</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fmtDate(e.date + 'T00:00')} · {t(e.category)}
                    {e.vatRate ? ` · ${t('incl. {amount} VAT', { amount: fmtMoney(vatAmount(e), e.currency) })}` : ''}
                    {e.notes ? ` — ${e.notes}` : ''}
                  </p>
                </div>
                <span className="font-mono text-sm tabular-nums">{fmtMoney(e.amount, e.currency)}</span>
                <button type="button" aria-label={t('Edit entry')} onClick={() => startEdit(e)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                  <Pencil size={14} />
                </button>
                <button type="button" aria-label={t('Delete entry')}
                  onClick={() => setEntries((x) => x.filter((y) => y.id !== e.id))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="hidden print:block">
            <p className="mt-4 text-xs text-slate-500">{t('Generated {date}', { date: fmtDateTime(new Date()) })}</p>
            <table className="mt-2 w-full border-collapse text-xs">
              <thead>
                <tr>
                  {['Date', 'Vendor', 'Amount', 'Currency', 'Category', 'Entity', 'VAT', 'Notes'].map((h) => (
                    <th key={h} className="border-b-2 border-slate-400 py-1 pr-2 text-left font-semibold">{t(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => (
                  <tr key={e.id}>
                    <td className="border-b border-slate-200 py-1 pr-2 whitespace-nowrap">{e.date}</td>
                    <td className="border-b border-slate-200 py-1 pr-2">{e.vendor}</td>
                    <td className="border-b border-slate-200 py-1 pr-2 text-right tabular-nums">{e.amount.toFixed(2)}</td>
                    <td className="border-b border-slate-200 py-1 pr-2">{e.currency}</td>
                    <td className="border-b border-slate-200 py-1 pr-2">{e.category}</td>
                    <td className="border-b border-slate-200 py-1 pr-2">{e.entity ?? ''}</td>
                    <td className="border-b border-slate-200 py-1 pr-2 text-right tabular-nums">
                      {e.vatRate ? vatAmount(e).toFixed(2) : ''}
                    </td>
                    <td className="border-b border-slate-200 py-1 pr-2">{e.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs font-semibold">
              {t('Totals: {totals} — monthly avg {avg}', {
                totals: [...curTotals].map(([c, tot]) => fmtMoney(tot, c)).join(' · '),
                avg: [...curTotals].map(([c, tot]) => fmtMoney(tot / monthCount, c)).join(' · '),
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function totalsByCurrency(entries: Entry[]) {
  const map = new Map<string, number>()
  for (const e of entries) map.set(e.currency, (map.get(e.currency) ?? 0) + e.amount)
  return map
}

function totalsByMonth(entries: Entry[]) {
  const map = new Map<string, Map<string, number>>()
  for (const e of entries) {
    const month = e.date.slice(0, 7)
    const cur = map.get(month) ?? new Map<string, number>()
    cur.set(e.currency, (cur.get(e.currency) ?? 0) + e.amount)
    map.set(month, cur)
  }
  return new Map([...map].sort(([a], [b]) => b.localeCompare(a)))
}

function totalsByCategory(entries: Entry[]) {
  const map = new Map<string, Map<string, number>>()
  for (const e of entries) {
    const cur = map.get(e.category) ?? new Map<string, number>()
    cur.set(e.currency, (cur.get(e.currency) ?? 0) + e.amount)
    map.set(e.category, cur)
  }
  return new Map([...map].sort((a, b) => sumMap(b[1]) - sumMap(a[1])))
}

const sumMap = (m: Map<string, number>) => [...m.values()].reduce((s, v) => s + v, 0)
