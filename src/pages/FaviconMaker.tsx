import { useCallback, useRef, useState } from 'react'
import {
  Check,
  Code2,
  FileArchive,
  Image as ImageIcon,
  Loader2,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { baseName, saveBlob } from '../lib/download'
import { t } from '../utils/i18n'

const SIZES = [
  { size: 16, name: 'favicon-16.png' },
  { size: 32, name: 'favicon-32.png' },
  { size: 48, name: 'favicon-48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
]

const BGS = [
  { id: 'transparent', label: 'Transparent', value: null },
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'black', label: 'Black', value: '#000000' },
] as const

type BgId = (typeof BGS)[number]['id']

const MANIFEST_SNIPPET = `{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}`

const paintIcon = (
  img: HTMLImageElement,
  size: number,
  bg: string | null,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)
  }
  const side = Math.min(img.width, img.height)
  const sx = (img.width - side) / 2
  const sy = (img.height - side) / 2
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
  return canvas
}

const canvasBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))

const pngToIco = async (png: Blob, size: number): Promise<Blob> => {
  const buf = await png.arrayBuffer()
  const header = new DataView(new ArrayBuffer(22))
  header.setUint16(0, 0, true)
  header.setUint16(2, 1, true)
  header.setUint16(4, 1, true)
  header.setUint8(6, size)
  header.setUint8(7, size)
  header.setUint16(10, 1, true)
  header.setUint16(12, 32, true)
  header.setUint32(14, buf.byteLength, true)
  header.setUint32(18, 22, true)
  return new Blob([header.buffer, buf], { type: 'image/x-icon' })
}

export default function FaviconMaker() {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [imgName, setImgName] = useState('')
  const [previews, setPreviews] = useState<{ name: string; size: number; url: string }[]>([])
  const [bg, setBg] = useState<BgId>('transparent')
  const [busy, setBusy] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const urlRef = useRef<string | null>(null)

  const bgValue = () => BGS.find((b) => b.id === bg)?.value ?? null

  const accept = useCallback(
    (files: File[]) => {
      const file = files.find((f) => f.type.startsWith('image/'))
      if (!file) {
        setError(t('Only image files are accepted.'))
        return
      }
      setBusy(true)
      setError(null)
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        const bgv = bgValue()
        setPreviews(
          SIZES.map(({ size, name }) => ({
            name,
            size,
            url: paintIcon(img, size, bgv).toDataURL('image/png'),
          })),
        )
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = url
        setImgUrl(url)
        setImgName(file.name)
        setBusy(false)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        setError(t('Could not read that image.'))
        setBusy(false)
      }
      img.src = url
    },
    [bg],
  )

  const changeBg = (id: BgId) => {
    setBg(id)
    const img = imgRef.current
    if (img) {
      const bgv = BGS.find((b) => b.id === id)?.value ?? null
      setPreviews(
        SIZES.map(({ size, name }) => ({
          name,
          size,
          url: paintIcon(img, size, bgv).toDataURL('image/png'),
        })),
      )
    }
  }

  const clear = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    imgRef.current = null
    setImgUrl(null)
    setImgName('')
    setPreviews([])
    setError(null)
  }

  const downloadZip = async () => {
    const img = imgRef.current
    if (!img) return
    setZipping(true)
    try {
      const bgv = bgValue()
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      for (const { size, name } of SIZES) {
        const blob = await canvasBlob(paintIcon(img, size, bgv))
        if (blob) zip.file(name, blob)
      }
      const png32 = await canvasBlob(paintIcon(img, 32, bgv))
      if (png32) zip.file('favicon.ico', await pngToIco(png32, 32))
      zip.file('manifest-snippet.json', `${MANIFEST_SNIPPET}\n`)
      const out = await zip.generateAsync({ type: 'blob' })
      saveBlob(out, `${baseName(imgName || 'favicon')}-icons.zip`)
    } finally {
      setZipping(false)
    }
  }

  const copyManifest = async () => {
    await navigator.clipboard.writeText(MANIFEST_SNIPPET)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-400'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Favicon Generator')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Turn any image into a full favicon and PWA icon set — PNG sizes, favicon.ico and a web manifest snippet, zipped on your device.',
        )}
      </p>

      {!imgUrl && (
        <div className="mt-6">
          <FilePicker
            accept="image/*"
            onFiles={accept}
            icon={ImageIcon}
            title={t('Drop an image here or click to choose')}
            subtitle={t('Center-cropped to a square before resizing.')}
          />
        </div>
      )}

      {busy && (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          {t('Generating icons…')}
        </p>
      )}

      {error && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <TriangleAlert size={14} />
          {error}
        </p>
      )}

      {imgUrl && !busy && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <img src={imgUrl} alt={imgName} className="h-12 w-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{imgName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('{count} icons ready — PNGs at every standard size plus favicon.ico.', {
                  count: SIZES.length + 1,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('Background')}
              </span>
              <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                {BGS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => changeBg(b.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      bg === b.id
                        ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {t(b.label)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={clear}
              aria-label={t('Remove')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-500/15 hover:text-red-500 dark:text-slate-400"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {previews.map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[repeating-conic-gradient(#e2e8f0_0%_25%,transparent_0%_50%)] bg-[length:12px_12px] dark:bg-[repeating-conic-gradient(#1e293b_0%_25%,transparent_0%_50%)]">
                  <img
                    src={p.url}
                    alt={p.name}
                    style={{
                      width: Math.min(p.size, 48),
                      height: Math.min(p.size, 48),
                    }}
                  />
                </div>
                <p className="text-center font-mono text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                  {p.size}×{p.size}
                  <br />
                  {p.name}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t('Web manifest snippet')}
            </p>
            <pre className="mt-1.5 overflow-x-auto font-mono text-xs text-slate-500 dark:text-slate-400">
              {MANIFEST_SNIPPET}
            </pre>
          </div>

          <div className="flex flex-wrap gap-2">
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
              {zipping ? t('Generating icons…') : t('Download .zip')}
            </button>
            <button type="button" onClick={() => void copyManifest()} className={btn}>
              {copied ? <Check size={16} /> : <Code2 size={16} />}
              {copied ? t('Copied!') : t('Copy snippet')}
            </button>
            <ShareButton
              payload={() => ({ kind: 'text', text: MANIFEST_SNIPPET, title: imgName })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
