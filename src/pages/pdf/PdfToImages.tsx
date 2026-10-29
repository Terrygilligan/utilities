import { useCallback, useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import {
  FileArchive,
  FileText,
  FileUp,
  ImageDown,
  Loader2,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import FilePicker from '../../components/FilePicker'
import ShareButton from '../../components/ShareButton'
import { pdfjs, saveBlob, baseName } from './shared'
import { fmtBytes } from '../../utils/locale'
import { t } from '../../utils/i18n'

const EXPORT_SCALE = 2
const THUMB_TARGET_WIDTH = 360

type Phase = 'idle' | 'loading' | 'rendering' | 'ready' | 'zipping'

interface Thumb {
  page: number
  url: string
}

async function renderPageToBlob(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
) {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const context = canvas.getContext('2d')
  if (!context) return null
  await page.render({ canvas, canvasContext: context, viewport, background: '#ffffff' })
    .promise
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export default function PdfToImages() {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [numPages, setNumPages] = useState(0)
  const [thumbs, setThumbs] = useState<Thumb[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [busyPage, setBusyPage] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const runIdRef = useRef(0)
  const urlsRef = useRef(new Set<string>())

  const reset = useCallback(() => {
    runIdRef.current += 1
    void pdfRef.current?.destroy()
    pdfRef.current = null
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    urlsRef.current.clear()
    setFile(null)
    setPhase('idle')
    setNumPages(0)
    setThumbs([])
    setProgress({ done: 0, total: 0 })
    setBusyPage(null)
    setError(null)
  }, [])

  useEffect(() => reset, [reset])

  const acceptFile = useCallback(
    (files: File[]) => {
      const candidate = files[0]
      if (!candidate) return
      const isPdf =
        candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        setError(t('That file is not a PDF.'))
        return
      }

      const loadId = ++runIdRef.current
      void pdfRef.current?.destroy()
      pdfRef.current = null
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      urlsRef.current.clear()
      setThumbs([])
      setError(null)
      setFile(candidate)
      setPhase('loading')
      setNumPages(0)
      setProgress({ done: 0, total: 0 })

      void (async () => {
        try {
          const data = await candidate.arrayBuffer()
          const pdf = await pdfjs.getDocument({ data }).promise
          if (loadId !== runIdRef.current) {
            void pdf.destroy()
            return
          }
          pdfRef.current = pdf
          setNumPages(pdf.numPages)
          setPhase('rendering')
          setProgress({ done: 0, total: pdf.numPages })

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            if (loadId !== runIdRef.current) return
            const page = await pdf.getPage(pageNumber)
            const baseViewport = page.getViewport({ scale: 1 })
            const blob = await renderPageToBlob(
              pdf,
              pageNumber,
              THUMB_TARGET_WIDTH / baseViewport.width,
            )
            if (!blob || loadId !== runIdRef.current) return
            const url = URL.createObjectURL(blob)
            urlsRef.current.add(url)
            setThumbs((current) => [...current, { page: pageNumber, url }])
            setProgress({ done: pageNumber, total: pdf.numPages })
          }
          setPhase('ready')
        } catch {
          if (loadId === runIdRef.current) {
            setError(t('Could not open this PDF — it may be corrupted or encrypted.'))
            setPhase('idle')
          }
        }
      })()
    },
    [],
  )

  const downloadPage = useCallback(
    async (pageNumber: number) => {
      const pdf = pdfRef.current
      if (!pdf || !file) return
      setBusyPage(pageNumber)
      try {
        const blob = await renderPageToBlob(pdf, pageNumber, EXPORT_SCALE)
        if (blob) saveBlob(blob, `${baseName(file.name)}-page-${pageNumber}.png`)
      } finally {
        setBusyPage(null)
      }
    },
    [file],
  )

  const buildZipBlob = useCallback(async () => {
    const pdf = pdfRef.current
    if (!pdf) return null
    setPhase('zipping')
    setError(null)
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const blob = await renderPageToBlob(pdf, pageNumber, EXPORT_SCALE)
        if (!blob) throw new Error('render failed')
        zip.file(`page-${String(pageNumber).padStart(3, '0')}.png`, blob)
        setProgress({ done: pageNumber, total: pdf.numPages })
      }
      return await zip.generateAsync({ type: 'blob' })
    } catch {
      setError(t('Could not build the ZIP archive.'))
      return null
    } finally {
      setPhase('ready')
    }
  }, [])

  const downloadZip = useCallback(async () => {
    if (!file) return
    const zipBlob = await buildZipBlob()
    if (zipBlob) saveBlob(zipBlob, `${baseName(file.name)}-pages.zip`)
  }, [file, buildZipBlob])

  const controlsDisabled = phase === 'loading' || phase === 'zipping'

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
          accept="application/pdf"
          onFiles={acceptFile}
          title={t('Drop a PDF here or click to browse')}
          subtitle={t('Every page is rendered to a PNG on-device')}
          icon={Upload}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <FileText size={20} className="shrink-0 text-sky-600 dark:text-sky-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-slate-500">
                {fmtBytes(file.size)}
                {numPages > 0 && ` · ${numPages === 1 ? t('1 page') : t('{count} pages', { count: numPages })}`}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={controlsDisabled}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
            >
              <FileUp size={15} />
              <span className="hidden sm:inline">{t('Open a different PDF')}</span>
              <span className="sm:hidden">{t('Change')}</span>
            </button>
          </div>

          {(phase === 'loading' || phase === 'rendering' || phase === 'zipping') && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {phase === 'loading' && t('Opening PDF…')}
                {phase === 'rendering' &&
                  t('Rendering previews {done}/{total}…', { done: progress.done, total: progress.total })}
                {phase === 'zipping' &&
                  t('Packing ZIP {done}/{total}…', { done: progress.done, total: progress.total })}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all"
                  style={{
                    width: progress.total
                      ? `${Math.round((progress.done / progress.total) * 100)}%`
                      : '4%',
                  }}
                />
              </div>
            </div>
          )}

          {thumbs.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {thumbs.map((thumb) => (
                <figure
                  key={thumb.page}
                  className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <img
                    src={thumb.url}
                    alt={t('Page {n}', { n: thumb.page })}
                    className="w-full object-contain"
                  />
                  <figcaption className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-[11px] font-medium tabular-nums text-slate-600 dark:text-slate-400">
                      {t('Page {n}', { n: thumb.page })}
                    </span>
                    <button
                      type="button"
                      onClick={() => void downloadPage(thumb.page)}
                      disabled={busyPage !== null || controlsDisabled}
                      aria-label={t('Download page {n} as PNG', { n: thumb.page })}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/15 disabled:opacity-40"
                    >
                      {busyPage === thumb.page ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <ImageDown size={12} />
                      )}
                      PNG
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {phase === 'ready' && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {numPages === 1 ? t('1 page ready') : t('{count} pages ready', { count: numPages })}
              </span>
              <button
                type="button"
                onClick={downloadZip}
                className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25"
              >
                <FileArchive size={16} />
                {t('Download all as ZIP')}
              </button>
              <ShareButton
                payload={async () => {
                  const blob = await buildZipBlob()
                  return blob && file
                    ? {
                        kind: 'file',
                        file: new File([blob], `${baseName(file.name)}-pages.zip`, {
                          type: 'application/zip',
                        }),
                      }
                    : null
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
