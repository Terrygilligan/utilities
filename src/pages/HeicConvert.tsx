import { useRef, useState } from 'react'
import {
  Check,
  Download,
  FileArchive,
  FileImage,
  Image as ImageIcon,
  Loader2,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { baseName, saveBlob } from '../lib/download'
import { fmtBytes } from '../utils/locale'
import { t } from '../utils/i18n'

interface HeicItem {
  id: string
  file: File
  status: 'pending' | 'busy' | 'done' | 'error'
  out: Blob[]
}

const isHeic = (file: File) =>
  /\.hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type)

const jpgName = (name: string, index: number, total: number) =>
  `${baseName(name)}${total > 1 ? `-${index + 1}` : ''}.jpg`

export default function HeicConvert() {
  const [items, setItems] = useState<HeicItem[]>([])
  const [quality, setQuality] = useState(0.85)
  const [busy, setBusy] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextId = useRef(0)

  const addFiles = (files: File[]) => {
    const heics = files.filter(isHeic)
    setError(
      heics.length < files.length
        ? t('Only HEIC/HEIF files are accepted.')
        : null,
    )
    if (!heics.length) return
    setItems((current) => [
      ...current,
      ...heics.map((file) => ({
        id: `heic-${nextId.current++}`,
        file,
        status: 'pending' as const,
        out: [],
      })),
    ])
  }

  const setItem = (id: string, patch: Partial<HeicItem>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )

  const convertAll = async () => {
    const pending = items.filter((i) => i.status === 'pending')
    if (!pending.length) return
    setBusy(true)
    const { default: heic2any } = await import('heic2any')
    for (const item of pending) {
      setItem(item.id, { status: 'busy' })
      try {
        const result = await heic2any({
          blob: item.file,
          toType: 'image/jpeg',
          quality,
          multiple: true,
        })
        const blobs = Array.isArray(result) ? result : [result]
        setItem(item.id, { status: 'done', out: blobs })
      } catch {
        setItem(item.id, { status: 'error' })
      }
    }
    setBusy(false)
  }

  const downloadItem = (item: HeicItem) => {
    item.out.forEach((blob, i) =>
      saveBlob(blob, jpgName(item.file.name, i, item.out.length)),
    )
  }

  const downloadZip = async () => {
    const done = items.filter((i) => i.status === 'done')
    if (!done.length) return
    setZipping(true)
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      for (const item of done) {
        item.out.forEach((blob, i) =>
          zip.file(jpgName(item.file.name, i, item.out.length), blob),
        )
      }
      const out = await zip.generateAsync({ type: 'blob' })
      saveBlob(out, 'heic-jpeg.zip')
    } finally {
      setZipping(false)
    }
  }

  const allBlobs = items.flatMap((i) => i.out)
  const pendingCount = items.filter((i) => i.status === 'pending').length
  const doneCount = items.filter((i) => i.status === 'done').length

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-400'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        {t('HEIC → JPEG Converter')}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Convert iPhone HEIC/HEIF photos to JPEG — decoding runs on your device, nothing is uploaded.',
        )}
      </p>

      <div className="mt-6">
        <FilePicker
          accept=".heic,.heif,image/heic,image/heif"
          multiple
          onFiles={addFiles}
          icon={ImageIcon}
          title={t('Drop HEIC files here or click to choose')}
        />
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <TriangleAlert size={14} />
          {error}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              {t('JPEG quality')}
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-28 accent-sky-600"
              />
              <span className="w-8 font-mono">{Math.round(quality * 100)}%</span>
            </label>
            <button
              type="button"
              onClick={() => void convertAll()}
              disabled={busy || !pendingCount}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileImage size={14} />
              )}
              {busy ? t('Converting…') : t('Convert to JPEG')}
            </button>
          </div>

          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{item.file.name}</span>
                  <span className="text-xs text-slate-400">
                    {fmtBytes(item.file.size)}
                    {item.status === 'done' &&
                      ` · ${t('{count} photos converted', { count: item.out.length })}`}
                    {item.status === 'error' &&
                      ` · ${t('Failed — the file may be corrupt or not really HEIC.')}`}
                  </span>
                </span>
                {item.status === 'busy' && (
                  <Loader2 size={16} className="animate-spin text-sky-500" />
                )}
                {item.status === 'done' && (
                  <button
                    type="button"
                    onClick={() => downloadItem(item)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 text-xs font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400"
                  >
                    <Download size={13} />
                    {t('Download')}
                  </button>
                )}
                {item.status === 'error' && (
                  <TriangleAlert size={16} className="text-red-500" />
                )}
                <button
                  type="button"
                  aria-label={t('Remove')}
                  onClick={() =>
                    setItems((current) =>
                      current.filter((x) => x.id !== item.id),
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-500/15 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>

          {doneCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {doneCount > 1 && (
                <button
                  type="button"
                  onClick={() => void downloadZip()}
                  disabled={zipping}
                  className={btn}
                >
                  {zipping ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileArchive size={16} />
                  )}
                  {t('Download all as .zip')}
                </button>
              )}
              {allBlobs.length === 1 && (
                <ShareButton
                  payload={() => ({
                    kind: 'file',
                    file: new File(
                      [allBlobs[0]],
                      jpgName(
                        items.find((i) => i.out.includes(allBlobs[0]))?.file.name ??
                          'photo.heic',
                        0,
                        1,
                      ),
                      { type: 'image/jpeg' },
                    ),
                  })}
                />
              )}
              <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <Check size={13} />
                {t('{count} photos converted', { count: allBlobs.length })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
