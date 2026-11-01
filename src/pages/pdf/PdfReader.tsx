import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileText,
  FileUp,
  ImageDown,
  Loader2,
  Pencil,
  PencilOff,
  Trash2,
  TriangleAlert,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import FilePicker from '../../components/FilePicker'
import ShareButton from '../../components/ShareButton'
import { saveBlob, baseName, IconButton, LoadingNote } from './shared'
import { fmtBytes } from '../../utils/locale'
import { t } from '../../utils/i18n'
import AnnotationLayer from './AnnotationLayer'
import EditBar from './EditBar'
import FormPanel from './FormPanel'
import PageStrip from './PageStrip'
import { buildEditedPdf } from './editExport'
import { EDIT_COLORS, TOOL_SIZES, emptyEditState, isEditDirty } from './editTypes'
import type { Annotation, EditState, EditTool } from './editTypes'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25
const EXPORT_SCALE = 2
const EMPTY_ANNOT: Annotation[] = []

interface PageViewProps {
  file: File
  shownSrc: number
  rot: number
  width: number
  editing: boolean
  deleted: boolean
  canAnnotate: boolean
  annotations: Annotation[]
  tool: EditTool
  color: string
  size: number
  onAdd: (a: Annotation) => void
  onDocLoad: (doc: PDFDocumentProxy) => void
  onDocError: () => void
}

// Memoized so formValues churn (widget typing) never re-renders the pdf.js DOM.
const PageView = memo(function PageView({
  file,
  shownSrc,
  rot,
  width,
  editing,
  deleted,
  canAnnotate,
  annotations,
  tool,
  color,
  size,
  onAdd,
  onDocLoad,
  onDocError,
}: PageViewProps) {
  return (
    <Document
      file={file}
      onLoadSuccess={onDocLoad}
      onLoadError={onDocError}
      loading={<LoadingNote>{t('Opening PDF…')}</LoadingNote>}
      error={<LoadingNote>{t('Unable to load document.')}</LoadingNote>}
    >
      <div className="relative mx-auto w-fit">
        <Page
          pageNumber={shownSrc}
          rotate={rot}
          width={width}
          className="mx-auto w-fit shadow-2xl shadow-black/40"
          renderAnnotationLayer={!editing || tool === 'select'}
          loading={<LoadingNote>{t('Rendering page…')}</LoadingNote>}
        />
        {canAnnotate && (
          <AnnotationLayer
            annotations={annotations}
            onAdd={onAdd}
            tool={tool}
            color={color}
            size={size}
          />
        )}
        {deleted && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/60 text-white">
            <Trash2 size={20} />
            <span className="px-3 text-center text-xs sm:text-sm">
              {t('Marked for deletion — this page will be excluded from the export.')}
            </span>
          </div>
        )}
      </div>
    </Document>
  )
})

export default function PdfReader() {
  const [file, setFile] = useState<File | null>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState<EditState>(() => emptyEditState(0))
  const [editTool, setEditTool] = useState<EditTool>('pen')
  const [editColor, setEditColor] = useState(EDIT_COLORS[0])
  const [sizeIdx, setSizeIdx] = useState(1)
  const [saving, setSaving] = useState(false)
  const [exportWarnings, setExportWarnings] = useState<string[]>([])

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
      setLoadError(t('That file is not a PDF.'))
      return
    }
    setFile(candidate)
    setPdf(null)
    setNumPages(0)
    setPageNumber(1)
    setZoom(1)
    setLoadError(null)
    setEditing(false)
    setEdit(emptyEditState(0))
    setExportWarnings([])
  }, [])

  const renderPagePng = useCallback(async () => {
    if (!pdf) return null
    const page = await pdf.getPage(edit.pages[pageNumber - 1]?.src ?? pageNumber)
    const rotation = page.rotate + (edit.pages[pageNumber - 1]?.rot ?? 0)
    const viewport = page.getViewport({ scale: EXPORT_SCALE, rotation })
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
  }, [pdf, pageNumber, edit.pages])

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

  const entry = edit.pages[pageNumber - 1]
  const shownSrc = entry?.src ?? pageNumber
  const shownDeleted = editing && !!entry?.deleted
  const pageAnnotations = edit.annotations[shownSrc] ?? EMPTY_ANNOT
  const dirty = isEditDirty(edit)

  const handleDocLoad = useCallback((document: PDFDocumentProxy) => {
    setPdf(document)
    setNumPages(document.numPages)
    setEdit(emptyEditState(document.numPages))
    setExportWarnings([])
  }, [])

  const handleDocError = useCallback(() => {
    setLoadError(t('Could not open this PDF — it may be corrupted or encrypted.'))
  }, [])

  const mutateAnnotations = useCallback(
    (fn: (list: Annotation[]) => Annotation[]) => {
      setEdit((cur) => {
        const src = cur.pages[pageNumber - 1]?.src ?? pageNumber
        const list = cur.annotations[src] ?? []
        const next = fn(list)
        if (next === list) return cur
        return { ...cur, annotations: { ...cur.annotations, [src]: next } }
      })
    },
    [pageNumber],
  )

  const addAnnotation = useCallback(
    (a: Annotation) => mutateAnnotations((list) => [...list, a]),
    [mutateAnnotations],
  )
  const undoAnnotation = useCallback(
    () => mutateAnnotations((list) => (list.length ? list.slice(0, -1) : list)),
    [mutateAnnotations],
  )
  const clearPageAnnotations = useCallback(
    () => mutateAnnotations((list) => (list.length ? [] : list)),
    [mutateAnnotations],
  )

  const buildEditedFile = useCallback(async (): Promise<File | null> => {
    if (!file) return null
    try {
      const { blob, warnings } = await buildEditedPdf(file, edit)
      setExportWarnings(warnings)
      return new File([blob], `${baseName(file.name)}-edited.pdf`, {
        type: 'application/pdf',
      })
    } catch {
      setLoadError(t('Could not build the edited PDF.'))
      return null
    }
  }, [file, edit])

  const downloadEdited = useCallback(async () => {
    setSaving(true)
    try {
      const edited = await buildEditedFile()
      if (edited) saveBlob(edited, edited.name)
    } finally {
      setSaving(false)
    }
  }, [buildEditedFile])

  // pdf.js widget elementId → AcroForm field name, per source page
  const widgetFieldsRef = useRef<Record<number, Map<string, { name: string; type: string }>> | null>(
    null,
  )

  useEffect(() => {
    widgetFieldsRef.current = null
    if (!pdf) return
    let cancelled = false
    void (async () => {
      const map: Record<number, Map<string, { name: string; type: string }>> = {}
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p)
        const annots = await page.getAnnotations()
        const m = new Map<string, { name: string; type: string }>()
        for (const a of annots) {
          if (a.fieldName && a.id) m.set(a.id, { name: a.fieldName, type: a.fieldType ?? '' })
        }
        map[p] = m
      }
      if (!cancelled) widgetFieldsRef.current = map
    })()
    return () => {
      cancelled = true
    }
  }, [pdf])

  // In select mode the pdf.js annotation layer is live — capture widget edits
  // into formValues as the user types/checks so they reach the export.
  const captureFieldValue = useCallback(
    (event: React.FormEvent) => {
      const target = event.target as HTMLElement
      const elementId = (target.closest?.('[data-element-id]') as HTMLElement | null)?.dataset
        ?.elementId
      if (!elementId) return
      const field = widgetFieldsRef.current?.[shownSrc]?.get(elementId)
      if (!field) return
      const input = target as HTMLInputElement | HTMLSelectElement
      let value: string
      if (input instanceof HTMLInputElement && input.type === 'checkbox') {
        value = String(input.checked)
      } else if (input instanceof HTMLInputElement && input.type === 'radio') {
        if (!input.checked) return
        value = input.value
      } else {
        value = input.value
      }
      setEdit((cur) => ({
        ...cur,
        formValues: { ...cur.formValues, [field.name]: value },
      }))
    },
    [shownSrc],
  )

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
          title={t('Drop a PDF here or click to browse')}
          subtitle={t('Processed on-device only')}
          icon={Upload}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <FileText size={20} className="shrink-0 text-sky-600 dark:text-sky-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-slate-500">
                {fmtBytes(file.size)}
                {numPages > 0 && ` · ${numPages === 1 ? t('1 page') : t('{count} pages', { count: numPages })}`}
              </p>
            </div>
            <label
              htmlFor="pdf-reader-input"
              className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            >
              <FileUp size={15} />
              <span className="hidden sm:inline">{t('Open a different PDF')}</span>
              <span className="sm:hidden">{t('Change')}</span>
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
              label={t('Previous page')}
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <span className="min-w-24 text-center text-sm tabular-nums text-slate-700 dark:text-slate-300">
              {t('Page {n} of {total}', { n: pageNumber, total: numPages || '—' })}
            </span>
            <IconButton
              label={t('Next page')}
              disabled={numPages === 0 || pageNumber >= numPages}
              onClick={() => setPageNumber((page) => Math.min(numPages, page + 1))}
            >
              <ChevronRight size={18} />
            </IconButton>

            <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

            <IconButton
              label={t('Zoom out')}
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
            >
              <ZoomOut size={18} />
            </IconButton>
            <span className="w-12 text-center text-sm tabular-nums text-slate-700 dark:text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <IconButton
              label={t('Zoom in')}
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
            >
              <ZoomIn size={18} />
            </IconButton>

            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              disabled={!pdf}
              aria-pressed={editing}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                editing
                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {editing ? <PencilOff size={16} /> : <Pencil size={16} />}
              <span className="hidden sm:inline">{editing ? t('Done') : t('Edit')}</span>
            </button>

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
              <span className="hidden sm:inline">{t('Download page as PNG')}</span>
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

          {editing && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                {t(
                  'Draw or type over the page, organize pages, and fill form fields — then download the edited PDF. Existing PDF text cannot be edited.',
                )}
              </p>
              <EditBar
                tool={editTool}
                color={editColor}
                sizeIdx={sizeIdx}
                canUndo={pageAnnotations.length > 0}
                canClear={pageAnnotations.length > 0}
                onTool={setEditTool}
                onColor={setEditColor}
                onSizeIdx={setSizeIdx}
                onUndo={undoAnnotation}
                onClear={clearPageAnnotations}
              />
            </div>
          )}

          <div
            className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-4"
            onInput={captureFieldValue}
            onChange={captureFieldValue}
          >
            <PageView
              file={file}
              shownSrc={shownSrc}
              rot={entry?.rot ?? 0}
              width={Math.max(200, Math.floor(viewerWidth * zoom))}
              editing={editing}
              deleted={shownDeleted}
              canAnnotate={editing && !!entry && !entry.deleted}
              annotations={pageAnnotations}
              tool={editTool}
              color={editColor}
              size={TOOL_SIZES[editTool === 'select' ? 'pen' : editTool][sizeIdx]}
              onAdd={addAnnotation}
              onDocLoad={handleDocLoad}
              onDocError={handleDocError}
            />
          </div>

          {editing && (
            <div className="space-y-3">
              <PageStrip
                pdf={pdf}
                pages={edit.pages}
                current={pageNumber - 1}
                onSelect={(index) => setPageNumber(index + 1)}
                onChange={(pages) => setEdit((cur) => ({ ...cur, pages }))}
              />
              <FormPanel
                file={file}
                formValues={edit.formValues}
                onChange={(name, value) =>
                  setEdit((cur) => ({
                    ...cur,
                    formValues: { ...cur.formValues, [name]: value },
                  }))
                }
              />
              {exportWarnings.map((warning) => (
                <div
                  key={warning}
                  className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
                >
                  <TriangleAlert size={18} className="shrink-0" />
                  {t(warning)}
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('Export applies your annotations, page changes, and form values.')}
                </span>
                <button
                  type="button"
                  onClick={downloadEdited}
                  disabled={!dirty || saving}
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  {saving ? t('Building…') : t('Download edited PDF')}
                </button>
                <ShareButton
                  disabled={!dirty}
                  payload={async () => {
                    const edited = await buildEditedFile()
                    return edited ? { kind: 'file', file: edited } : null
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
