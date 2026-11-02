import { useCallback, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  FileOutput,
  Files,
  Loader2,
  Merge as MergeIcon,
  Scissors,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import FilePicker from '../../components/FilePicker'
import ShareButton from '../../components/ShareButton'
import { baseName, saveBlob } from './shared'
import { fmtBytes } from '../../utils/locale'
import { t } from '../../utils/i18n'

type Mode = 'merge' | 'split'

interface PdfItem {
  id: string
  file: File
}

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)

const parseRanges = (input: string, pageCount: number): number[] | null => {
  const indices = new Set<number>()
  for (const raw of input.split(',')) {
    const part = raw.trim()
    if (!part) continue
    const match = part.match(/^(\d+)\s*-\s*(\d+)$|^(\d+)$/)
    if (!match) return null
    const start = Number(match[1] ?? match[3])
    const end = match[2] ? Number(match[2]) : start
    if (start < 1 || end < start || end > pageCount) return null
    for (let i = start; i <= end; i++) indices.add(i - 1)
  }
  return indices.size ? [...indices].sort((a, b) => a - b) : null
}

const rowBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-500/15 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'

export default function MergeSplit() {
  const [mode, setMode] = useState<Mode>('merge')
  const [items, setItems] = useState<PdfItem[]>([])
  const [splitFile, setSplitFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [ranges, setRanges] = useState('')
  const [outBytes, setOutBytes] = useState<Uint8Array | null>(null)
  const [outName, setOutName] = useState('merged.pdf')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bytesRef = useRef<ArrayBuffer | null>(null)
  const nextIdRef = useRef(0)

  const addMergeFiles = useCallback((files: File[]) => {
    const pdfs = files.filter(isPdf)
    if (pdfs.length < files.length) {
      setError(t('Only PDF files are accepted.'))
    } else {
      setError(null)
    }
    setOutBytes(null)
    setItems((current) => [
      ...current,
      ...pdfs.map((file) => ({ id: `pdf-${nextIdRef.current++}`, file })),
    ])
  }, [])

  const move = useCallback((id: string, dir: -1 | 1) => {
    setItems((current) => {
      const i = current.findIndex((item) => item.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= current.length) return current
      const next = [...current]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [])

  const acceptSplitFile = useCallback((files: File[]) => {
    const file = files.find(isPdf)
    if (!file) {
      setError(t('Only PDF files are accepted.'))
      return
    }
    setBusy(true)
    setError(null)
    setOutBytes(null)
    void (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib')
        const buf = await file.arrayBuffer()
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
        bytesRef.current = buf
        setSplitFile(file)
        setPageCount(doc.getPageCount())
        setRanges('')
      } catch {
        setError(t('Could not read this file - is it a valid PDF?'))
        setSplitFile(null)
        bytesRef.current = null
      } finally {
        setBusy(false)
      }
    })()
  }, [])

  const mergeNow = useCallback(async () => {
    setBusy(true)
    setError(null)
    setOutBytes(null)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const out = await PDFDocument.create()
      for (const item of items) {
        const src = await PDFDocument.load(await item.file.arrayBuffer(), {
          ignoreEncryption: true,
        })
        for (const page of await out.copyPages(src, src.getPageIndices())) {
          out.addPage(page)
        }
      }
      const bytes = await out.save()
      setOutBytes(bytes)
      setOutName('merged.pdf')
      saveBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), 'merged.pdf')
    } catch {
      setError(t('Could not merge - a file may be corrupt or password-protected.'))
    } finally {
      setBusy(false)
    }
  }, [items])

  const extractNow = useCallback(async () => {
    const buf = bytesRef.current
    if (!buf || !splitFile) return
    const indices = parseRanges(ranges, pageCount)
    if (!indices) {
      setError(t('Invalid page range - use formats like 1-3, 5, 8-10.'))
      return
    }
    setBusy(true)
    setError(null)
    setOutBytes(null)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const src = await PDFDocument.load(buf, { ignoreEncryption: true })
      const out = await PDFDocument.create()
      for (const page of await out.copyPages(src, indices)) out.addPage(page)
      const bytes = await out.save()
      const name = `${baseName(splitFile.name)}-pages.pdf`
      setOutBytes(bytes)
      setOutName(name)
      saveBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), name)
    } catch {
      setError(t('Could not extract those pages.'))
    } finally {
      setBusy(false)
    }
  }, [pageCount, ranges, splitFile])

  const seg = (id: Mode, label: string, Icon: typeof MergeIcon) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setMode(id)
        setError(null)
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

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {seg('merge', 'Merge PDFs', MergeIcon)}
        {seg('split', 'Split PDF', Scissors)}
      </div>

      {mode === 'merge' && (
        <div className="space-y-3">
          <FilePicker
            accept="application/pdf,.pdf"
            multiple
            onFiles={addMergeFiles}
            icon={Files}
            title={t('Drop PDF files here or click to choose')}
            subtitle={t('PDFs are combined top to bottom in the order shown.')}
          />
          {items.length > 0 && (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {items.map((item, i) => (
                <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-6 text-center text-xs font-medium text-slate-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{item.file.name}</span>
                  <span className="text-xs text-slate-400">{fmtBytes(item.file.size)}</span>
                  <button
                    type="button"
                    aria-label={t('Move up')}
                    onClick={() => move(item.id, -1)}
                    disabled={i === 0}
                    className={`${rowBtn} disabled:opacity-30`}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('Move down')}
                    onClick={() => move(item.id, 1)}
                    disabled={i === items.length - 1}
                    className={`${rowBtn} disabled:opacity-30`}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('Remove')}
                    onClick={() =>
                      setItems((current) => current.filter((x) => x.id !== item.id))
                    }
                    className={`${rowBtn} hover:text-red-500`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void mergeNow()}
              disabled={busy || items.length < 2}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <MergeIcon size={16} />}
              {busy ? t('Merging…') : t('Merge {count} PDFs', { count: items.length })}
            </button>
            <ShareButton
              disabled={!outBytes}
              payload={() =>
                outBytes
                  ? {
                      kind: 'file',
                      file: new File([outBytes as BlobPart], outName, {
                        type: 'application/pdf',
                      }),
                    }
                  : null
              }
            />
          </div>
          {items.length < 2 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('Add at least 2 PDFs to merge.')}
            </p>
          )}
        </div>
      )}

      {mode === 'split' && (
        <div className="space-y-3">
          {!splitFile ? (
            <FilePicker
              accept="application/pdf,.pdf"
              onFiles={acceptSplitFile}
              icon={FileOutput}
              title={t('Pick the PDF to split')}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{splitFile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {fmtBytes(splitFile.size)} · {t('{count} pages', { count: pageCount })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSplitFile(null)
                    bytesRef.current = null
                    setOutBytes(null)
                  }}
                  aria-label={t('Remove')}
                  className={rowBtn}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <label className="mt-4 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('Page ranges')}
                <input
                  type="text"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder={t('e.g. 1-3, 5, 8-10')}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void extractNow()}
                  disabled={busy || !ranges.trim()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Scissors size={16} />}
                  {busy ? t('Extracting…') : t('Extract pages')}
                </button>
                <ShareButton
                  disabled={!outBytes}
                  payload={() =>
                    outBytes
                      ? {
                          kind: 'file',
                          file: new File([outBytes as BlobPart], outName, {
                            type: 'application/pdf',
                          }),
                        }
                      : null
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <TriangleAlert size={13} />
          {error}
        </p>
      )}
    </div>
  )
}
