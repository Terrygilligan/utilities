import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, ImageDown, Loader2 } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { saveBlob, baseName } from '../lib/download'
import { fmtBytes } from '../utils/locale'

type Format = 'image/webp' | 'image/jpeg' | 'image/png'

export default function ImageOptimizer() {
  const [file, setFile] = useState<File | null>(null)
  const [srcUrl, setSrcUrl] = useState('')
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(100)
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState<Format>('image/webp')
  const [outUrl, setOutUrl] = useState('')
  const [outSize, setOutSize] = useState(0)
  const [busy, setBusy] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const pick = useCallback((f: File) => {
    setFile(f)
    setOutUrl('')
    const url = URL.createObjectURL(f)
    setSrcUrl(url)
    const img = new Image()
    img.onload = () => {
      setDims({ w: img.naturalWidth, h: img.naturalHeight })
      imgRef.current = img
    }
    img.src = url
  }, [])

  const process = useCallback(async (): Promise<Blob | null> => {
    const img = imgRef.current
    if (!img) return null
    const w = Math.max(1, Math.round(img.naturalWidth * (scale / 100)))
    const h = Math.max(1, Math.round(img.naturalHeight * (scale / 100)))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, 0, 0, w, h)
    return new Promise((r) => canvas.toBlob(r, format, quality / 100))
  }, [scale, format, quality])

  useEffect(() => {
    if (!imgRef.current || !file) return
    setBusy(true)
    const t = window.setTimeout(async () => {
      const blob = await process()
      if (blob) {
        if (outUrl) URL.revokeObjectURL(outUrl)
        setOutUrl(URL.createObjectURL(blob))
        setOutSize(blob.size)
      }
      setBusy(false)
    }, 150)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process])

  useEffect(
    () => () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl)
      if (outUrl) URL.revokeObjectURL(outUrl)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [srcUrl],
  )

  const outName = file
    ? `${baseName(file.name)}.${format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png'}`
    : ''

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Image Optimizer</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Resize, compress, and convert images in your browser. Rendering through
        canvas strips EXIF metadata (location, camera info) automatically.
      </p>

      {!file ? (
        <FilePicker
          accept="image/png,image/jpeg,image/webp"
          title="Drop a JPEG, PNG, or WebP image"
          subtitle="Resized and converted entirely in your browser — EXIF stripped automatically"
          icon={ImageDown}
          onFiles={(files) => files[0] && pick(files[0])}
        />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <label className="flex-1 min-w-40 text-sm">
              <span className="flex justify-between text-slate-700 dark:text-slate-300">
                Scale <b className="text-sky-600 dark:text-sky-400">{scale}%</b>
              </span>
              <input type="range" min={10} max={100} value={scale}
                onChange={(e) => setScale(+e.target.value)}
                className="mt-2 w-full accent-sky-500" />
            </label>
            <label className="flex-1 min-w-40 text-sm">
              <span className="flex justify-between text-slate-700 dark:text-slate-300">
                Quality <b className="text-sky-600 dark:text-sky-400">{quality}%</b>
              </span>
              <input type="range" min={10} max={100} value={quality}
                onChange={(e) => setQuality(+e.target.value)}
                disabled={format === 'image/png'}
                className="mt-2 w-full accent-sky-500 disabled:opacity-40" />
            </label>
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Format
              <select value={format} onChange={(e) => setFormat(e.target.value as Format)}
                className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                <option value="image/webp">WebP</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </label>
            <button type="button" onClick={() => { setFile(null); setSrcUrl(''); setOutUrl(''); imgRef.current = null }}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Choose a different image
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(
              [
                ['Original', srcUrl, file.size, `${dims.w}×${dims.h}`],
                ['Optimized', outUrl, outSize, `${Math.round(dims.w * scale / 100)}×${Math.round(dims.h * scale / 100)}`],
              ] as const
            ).map(([label, url, size, d]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium uppercase tracking-wide">{label}</span>
                  <span>{d} · {size ? fmtBytes(size) : '…'}</span>
                </div>
                <div className="mt-3 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950/60">
                  {url ? <img src={url} alt={label} className="max-h-full max-w-full object-contain" /> : <Loader2 size={22} className="animate-spin text-slate-400" />}
                </div>
                {label === 'Optimized' && file && outSize > 0 && (
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    {Math.round((1 - outSize / file.size) * 100)}% smaller
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={busy || !outUrl}
              onClick={async () => { const b = await process(); if (b) saveBlob(b, outName) }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
              <Download size={16} /> Download {busy && '…'}
            </button>
            <ShareButton disabled={busy || !outUrl}
              payload={async () => {
                const b = await process()
                return b ? { kind: 'file', file: new File([b], outName, { type: format }) } : null
              }} />
          </div>
        </>
      )}
    </div>
  )
}
