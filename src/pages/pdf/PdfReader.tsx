import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FileUp,
  ImageDown,
  Loader2,
  TriangleAlert,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import FilePicker from '../../components/FilePicker'
import ShareButton from '../../components/ShareButton'
import { saveBlob, baseName, IconButton, LoadingNote } from './shared'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25
const EXPORT_SCALE = 2

export default function PdfReader() {
  const [file, setFile] = useState<File | null>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const [viewerWidth, setViewerWidth] = useState(0)

  useEffect(() => {
    const element = rootRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setViewerWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const acceptFile = useCallback((files: File[]) => {
    const candidate = files[0]
    if (!candidate) return
    const isPdf =
      candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setLoadError('That file is not a PDF.')
      return
    }
    setFile(candidate)
    setPdf(null)
    setNumPages(0)
    setPageNumber(1)
    setZoom(1)
    setLoadError(null)
  }, [])

  const renderPagePng = useCallback(async () => {
    if (!pdf) return null
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: EXPORT_SCALE })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) return null
    await page.render({
      canvas,
      canvasContext: context,
      viewport,
      background: '#ffffff',
    }).promise
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  }, [pdf, pageNumber])

  const downloadPageAsPng = useCallback(async () => {
    if (!pdf || !file) return
    setExporting(true)
    try {
      const blob = await renderPagePng()
      if (blob) saveBlob(blob, `${baseName(file.name)}-page-${pageNumber}.png`)
    } finally {
      setExporting(false)
    }
  }, [pdf, file, pageNumber, renderPagePng])

  return (
    <div ref={rootRef}>
      {loadError && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <TriangleAlert size={18} className="shrink-0" />
          {loadError}
        </div>
      )}

      {!file ? (
        <FilePicker
          accept="application/pdf"
          onFiles={acceptFile}
          title="Drop a PDF here or click to browse"
          subtitle="Processed on-device only"
          icon={Upload}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <FileText size={20} className="shrink-0 text-sky-600 dark:text-sky-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
                {numPages > 0 && ` · ${numPages} pages`}
              </p>
            </div>
            <label
              htmlFor="pdf-reader-input"
              className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            >
              <FileUp size={15} />
              <span className="hidden sm:inline">Open a different PDF</span>
              <span className="sm:hidden">Change</span>
            </label>
            <input
              id="pdf-reader-input"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) => {
                const picked = event.target.files?.[0]
                if (picked) acceptFile([picked])
                event.target.value = ''
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2">
            <IconButton
              label="Previous page"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <span className="min-w-24 text-center text-sm tabular-nums text-slate-700 dark:text-slate-300">
              Page {pageNumber} of {numPages || '—'}
            </span>
            <IconButton
              label="Next page"
              disabled={numPages === 0 || pageNumber >= numPages}
              onClick={() => setPageNumber((page) => Math.min(numPages, page + 1))}
            >
              <ChevronRight size={18} />
            </IconButton>

            <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

            <IconButton
              label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
            >
              <ZoomOut size={18} />
            </IconButton>
            <span className="w-12 text-center text-sm tabular-nums text-slate-700 dark:text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <IconButton
              label="Zoom in"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
            >
              <ZoomIn size={18} />
            </IconButton>

            <button
              type="button"
              onClick={downloadPageAsPng}
              disabled={!pdf || exporting}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-3 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ImageDown size={16} />
              )}
              <span className="hidden sm:inline">Download page as PNG</span>
              <span className="sm:hidden">PNG</span>
            </button>
            <ShareButton
              disabled={!pdf}
              payload={async () => {
                const blob = await renderPagePng()
                return blob && file
                  ? {
                      kind: 'file',
                      file: new File(
                        [blob],
                        `${baseName(file.name)}-page-${pageNumber}.png`,
                        { type: 'image/png' },
                      ),
                    }
                  : null
              }}
            />
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-4">
            <Document
              file={file}
              onLoadSuccess={(document) => {
                setPdf(document)
                setNumPages(document.numPages)
              }}
              onLoadError={() =>
                setLoadError('Could not open this PDF — it may be corrupted or encrypted.')
              }
              loading={<LoadingNote>Opening PDF…</LoadingNote>}
              error={<LoadingNote>Unable to load document.</LoadingNote>}
            >
              <Page
                pageNumber={pageNumber}
                width={Math.max(200, Math.floor(viewerWidth * zoom))}
                className="mx-auto w-fit shadow-2xl shadow-black/40"
                loading={<LoadingNote>Rendering page…</LoadingNote>}
              />
            </Document>
          </div>
        </div>
      )}
    </div>
  )
}
