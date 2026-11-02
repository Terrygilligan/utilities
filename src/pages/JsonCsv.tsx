import { useRef, useState } from 'react'
import {
  ArrowLeftRight,
  Check,
  Copy,
  Download,
  FileJson2,
  FileUp,
  Table2,
  TriangleAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ShareButton from '../components/ShareButton'
import { baseName, saveBlob } from '../lib/download'
import { t } from '../utils/i18n'

type Mode = 'to-csv' | 'to-json'
type Row = Record<string, unknown>

const MAX_BYTES = 5 * 1024 * 1024

const flatten = (obj: Row, prefix: string, out: Row): Row => {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value as Row, path, out)
    } else {
      out[path] = value
    }
  }
  return out
}

const toRows = (data: unknown): Row[] | null => {
  if (Array.isArray(data)) {
    return data.map((item) =>
      item !== null && typeof item === 'object' && !Array.isArray(item)
        ? flatten(item as Row, '', {})
        : { value: item },
    )
  }
  if (data !== null && typeof data === 'object') {
    for (const value of Object.values(data)) {
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((i) => i !== null && typeof i === 'object' && !Array.isArray(i))
      ) {
        return toRows(value)
      }
    }
    return [flatten(data as Row, '', {})]
  }
  return null
}

const csvEscape = (value: unknown): string => {
  const s =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const jsonToCsv = (rows: Row[]): string => {
  const headers: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        headers.push(key)
      }
    }
  }
  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) lines.push(headers.map((h) => csvEscape(row[h])).join(','))
  return lines.join('\r\n')
}

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  let i = 0
  const pushRow = () => {
    row.push(field)
    field = ''
    rows.push(row)
    row = []
  }
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
          inQuotes = false
          i += 1
        }
      } else {
        field += c
        i += 1
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
      i += 1
    } else if (c === ',') {
      row.push(field)
      field = ''
      i += 1
    } else if (c === '\r') {
      if (text[i + 1] === '\n') i += 1
      pushRow()
      i += 1
    } else if (c === '\n') {
      pushRow()
      i += 1
    } else {
      field += c
      i += 1
    }
  }
  if (field !== '' || row.length > 0) pushRow()
  return rows
}

const csvToJson = (text: string, hasHeaders: boolean): Row[] | null => {
  const grid = parseCsv(text.replace(/^\uFEFF/, '')).filter((r) =>
    r.some((cell) => cell !== ''),
  )
  if (grid.length === 0) return null
  if (!hasHeaders) {
    return grid.map((r) => {
      const out: Row = {}
      r.forEach((cell, i) => {
        out[`col_${i + 1}`] = cell
      })
      return out
    })
  }
  const headers = grid[0].map((h, i) => (h.trim() === '' ? `col_${i + 1}` : h.trim()))
  return grid.slice(1).map((r) => {
    const out: Row = {}
    headers.forEach((h, i) => {
      out[h] = r[i] ?? ''
    })
    return out
  })
}

export default function JsonCsv() {
  const [mode, setMode] = useState<Mode>('to-csv')
  const [input, setInput] = useState('')
  const [hasHeaders, setHasHeaders] = useState(true)
  const [output, setOutput] = useState('')
  const [outName, setOutName] = useState('')
  const [outMime, setOutMime] = useState('')
  const [stats, setStats] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setOutput('')
    setStats('')
    setError(null)
    setCopied(false)
  }

  const loadFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      setError(t('That file is too large — the limit is 5 MB.'))
      return
    }
    setFileName(file.name)
    setInput(await file.text())
    reset()
  }

  const convert = () => {
    reset()
    const text = input.trim()
    if (!text) return
    if (mode === 'to-csv') {
      try {
        const rows = toRows(JSON.parse(text))
        if (!rows || rows.length === 0) {
          setError(t('Could not find any rows — the JSON must be an object or an array.'))
          return
        }
        setOutput(jsonToCsv(rows))
        setOutName(`${baseName(fileName || 'data')}.csv`)
        setOutMime('text/csv')
        setStats(t('{count} rows converted', { count: rows.length }))
      } catch {
        setError(t('That does not look like valid JSON — check brackets, quotes and commas.'))
      }
    } else {
      const rows = csvToJson(text, hasHeaders)
      if (!rows || rows.length === 0) {
        setError(t('No data rows found — the CSV needs at least one row of values.'))
        return
      }
      setOutput(JSON.stringify(rows, null, 2))
      setOutName(`${baseName(fileName || 'data')}.json`)
      setOutMime('application/json')
      setStats(t('{count} rows converted', { count: rows.length }))
    }
  }

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const seg = (id: Mode, label: string, Icon: LucideIcon) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setMode(id)
        reset()
      }}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
        mode === id
          ? 'bg-slate-200 text-slate-900 shadow dark:bg-slate-800 dark:text-white'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      <Icon size={15} />
      {t(label)}
    </button>
  )

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-400'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('JSON ↔ CSV Converter')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Flatten JSON into spreadsheet-ready CSV or turn CSV rows back into JSON — parsed entirely on your device.',
        )}
      </p>

      <div className="mt-6 flex max-w-md rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {seg('to-csv', 'JSON → CSV', FileJson2)}
        {seg('to-json', 'CSV → JSON', Table2)}
      </div>

      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setFileName('')
          reset()
        }}
        rows={8}
        spellCheck={false}
        placeholder={
          mode === 'to-csv'
            ? t('Paste JSON here — an array of objects works best…')
            : t('Paste CSV here, or load a .csv file…')
        }
        className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950/60"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <FileUp size={14} />
          {t('Load file')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={mode === 'to-csv' ? '.json,application/json' : '.csv,text/csv'}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void loadFile(file)
            e.target.value = ''
          }}
        />
        {mode === 'to-json' && (
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={hasHeaders}
              onChange={(e) => setHasHeaders(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-sky-600"
            />
            {t('First row contains column names')}
          </label>
        )}
        <button
          type="button"
          onClick={convert}
          disabled={!input.trim()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          <ArrowLeftRight size={14} />
          {mode === 'to-csv' ? t('Convert to CSV') : t('Convert to JSON')}
        </button>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <TriangleAlert size={14} />
          {error}
        </p>
      )}

      {output && (
        <>
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-800 dark:bg-slate-950/40">
            {output}
          </pre>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stats}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyOutput()} className={btn}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? t('Copied!') : t('Copy')}
            </button>
            <button
              type="button"
              onClick={() =>
                saveBlob(
                  new Blob(
                    [outMime === 'text/csv' ? `\uFEFF${output}` : output],
                    { type: `${outMime};charset=utf-8` },
                  ),
                  outName,
                )
              }
              className={btn}
            >
              <Download size={16} />
              {t('Download')}
            </button>
            <ShareButton
              payload={() => ({
                kind: 'file',
                file: new File([output], outName, { type: outMime }),
              })}
            />
          </div>
        </>
      )}
    </div>
  )
}
