import { useCallback, useEffect, useRef, useState } from 'react'
import { FileDown, Images, Loader2, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import FilePicker from '../../components/FilePicker'
import ShareButton from '../../components/ShareButton'
import { saveBlob } from './shared'

interface PickedImage {
  id: string
  file: File
  url: string
}

const isSupported = (file: File) =>
  file.type === 'image/png' ||
  file.type === 'image/jpeg' ||
  /\.(png|jpe?g)$/i.test(file.name)

export default function ImagesToPdf() {
  const [images, setImages] = useState<PickedImage[]>([])
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const urlsRef = useRef(new Set<string>())
  const nextIdRef = useRef(0)

  useEffect(() => {
    const urls = urlsRef.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const addImages = useCallback((files: File[]) => {
    const supported = files.filter(isSupported)
    if (supported.length < files.length) {
      setError(
        `Skipped ${files.length - supported.length} unsupported file(s) — only PNG and JPEG images are accepted.`,
      )
    } else {
      setError(null)
    }
    setImages((current) => [
      ...current,
      ...supported.map((file) => {
        const url = URL.createObjectURL(file)
        urlsRef.current.add(url)
        return { id: `img-${nextIdRef.current++}`, file, url }
      }),
    ])
  }, [])

  const removeImage = useCallback((id: string) => {
    setImages((current) => {
      const removed = current.find((image) => image.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.url)
        urlsRef.current.delete(removed.url)
      }
      return current.filter((image) => image.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    setImages((current) => {
      current.forEach((image) => {
        URL.revokeObjectURL(image.url)
        urlsRef.current.delete(image.url)
      })
      return []
    })
    setError(null)
  }, [])

  const buildPdfBlob = useCallback(async () => {
    if (images.length === 0) return null
    try {
      const { PDFDocument } = await import('pdf-lib')
      const doc = await PDFDocument.create()
      for (const image of images) {
        const bytes = await image.file.arrayBuffer()
        const embedded =
          image.file.type === 'image/png' || /\.png$/i.test(image.file.name)
            ? await doc.embedPng(bytes)
            : await doc.embedJpg(bytes)
        const page = doc.addPage([embedded.width, embedded.height])
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: embedded.width,
          height: embedded.height,
        })
      }
      const pdfBytes = await doc.save()
      return new Blob([pdfBytes.slice()], { type: 'application/pdf' })
    } catch {
      setError('Could not build the PDF — one of the images may be corrupt or unsupported.')
      return null
    }
  }, [images])

  const buildPdf = useCallback(async () => {
    setBuilding(true)
    setError(null)
    try {
      const blob = await buildPdfBlob()
      if (blob) saveBlob(blob, 'images.pdf')
    } finally {
      setBuilding(false)
    }
  }, [buildPdfBlob])

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <TriangleAlert size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <FilePicker
        accept="image/png,image/jpeg"
        multiple
        onFiles={addImages}
        title="Drop images here or click to browse"
        subtitle="PNG or JPEG · multiple files welcome · pages follow the order shown below"
        icon={Images}
      />

      {images.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image, index) => (
              <figure
                key={image.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <img
                  src={image.url}
                  alt={image.file.name}
                  className="aspect-[3/4] w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-slate-700 dark:text-slate-300">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  aria-label={`Remove ${image.file.name}`}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-slate-950/80 text-slate-700 dark:text-slate-300 transition hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-300"
                >
                  <X size={14} />
                </button>
                <figcaption className="truncate px-2 py-1.5 text-[11px] text-slate-500">
                  {image.file.name}
                </figcaption>
              </figure>
            ))}

            <label
              htmlFor="pdf-img-more"
              className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 transition hover:border-slate-500 hover:text-slate-300"
            >
              <Plus size={20} />
              <span className="text-xs font-medium">Add more</span>
              <input
                id="pdf-img-more"
                type="file"
                accept="image/png,image/jpeg"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addImages(Array.from(event.target.files ?? []))
                  event.target.value = ''
                }}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {images.length} image{images.length === 1 ? '' : 's'} →{' '}
              {images.length} page{images.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            >
              <Trash2 size={16} />
              Clear
            </button>
            <button
              type="button"
              onClick={buildPdf}
              disabled={building}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {building ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              {building ? 'Building…' : 'Create & download PDF'}
            </button>
            <ShareButton
              disabled={images.length === 0}
              payload={async () => {
                const blob = await buildPdfBlob()
                return blob
                  ? {
                      kind: 'file',
                      file: new File([blob], 'images.pdf', { type: 'application/pdf' }),
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
