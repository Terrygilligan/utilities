import { useEffect, useRef, useState } from 'react'
import { Download, ImageDown, Stamp } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { baseName, saveBlob } from '../lib/download'
import { fmtBytes } from '../utils/locale'

type Pos = 'br' | 'bl' | 'tr' | 'tl' | 'center'

export default function WatermarkTool() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('© TOG Utilities')
  const [pos, setPos] = useState<Pos>('br')
  const [opacity, setOpacity] = useState(60)
  const [sizePct, setSizePct] = useState(6)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [outBlob, setOutBlob] = useState<Blob | null>(null)
  const [imgSize, setImgSize] = useState('')

  useEffect(() => {
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const c = canvasRef.current!
      c.width = img.width; c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const px = Math.max(12, Math.round(img.width * (sizePct / 100)))
      ctx.font = `600 ${px}px system-ui, sans-serif`
      ctx.globalAlpha = opacity / 100
      ctx.textBaseline = 'bottom'
      const m = ctx.measureText(text)
      const pad = px * 0.6
      const x = pos === 'center' ? (img.width - m.width) / 2
        : pos.endsWith('r') ? img.width - m.width - pad : pad
      const y = pos.startsWith('t') ? pad + px : pos === 'center' ? (img.height + px) / 2 : img.height - pad
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = px * 0.15
      ctx.fillStyle = '#ffffff'
      ctx.fillText(text, x, y)
      c.toBlob((b) => setOutBlob(b), 'image/png')
      setImgSize(`${img.width}×${img.height}`)
      URL.revokeObjectURL(url)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file, text, pos, opacity, sizePct])

  const name = `${baseName(file?.name ?? 'image')}-watermarked.png`

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Image Watermarker</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Overlay text on a photo — canvas-composited, so EXIF metadata is stripped automatically.
      </p>

      {!file ? (
        <div className="mt-6">
          <FilePicker accept="image/*" icon={ImageDown} title="Drop an image to watermark" subtitle="JPEG, PNG, WebP — processed locally" onFiles={(f) => f[0] && setFile(f[0])} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <canvas ref={canvasRef} className="w-full rounded-lg" />
            <p className="mt-2 text-xs text-slate-500">{file.name} · {imgSize} · {fmtBytes(file.size)}{outBlob ? ` → ${fmtBytes(outBlob.size)}` : ''}</p>
          </div>
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <label className="block text-xs text-slate-500">Watermark text
              <input value={text} onChange={(e) => setText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60" />
            </label>
            <label className="block text-xs text-slate-500">Position
              <select value={pos} onChange={(e) => setPos(e.target.value as Pos)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60">
                <option value="br">Bottom right</option><option value="bl">Bottom left</option>
                <option value="tr">Top right</option><option value="tl">Top left</option>
                <option value="center">Center</option>
              </select>
            </label>
            <label className="block text-xs text-slate-500">Size — {sizePct}%
              <input type="range" min={2} max={20} value={sizePct} onChange={(e) => setSizePct(+e.target.value)} className="mt-2 w-full accent-sky-500" />
            </label>
            <label className="block text-xs text-slate-500">Opacity — {opacity}%
              <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="mt-2 w-full accent-sky-500" />
            </label>
            <div className="flex gap-2 pt-1">
              <button type="button" disabled={!outBlob} onClick={() => outBlob && saveBlob(outBlob, name)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500/15 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
                <Download size={15} /> PNG
              </button>
              <ShareButton disabled={!outBlob} payload={() => outBlob ? { kind: 'file', file: new File([outBlob], name, { type: 'image/png' }) } : null} />
            </div>
            <button type="button" onClick={() => { setFile(null); setOutBlob(null) }}
              className="w-full text-xs text-slate-500 transition hover:text-slate-700 dark:hover:text-slate-300">
              Choose a different image
            </button>
          </div>
        </div>
      )}
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Stamp size={13} /> Everything happens on-device; originals are never uploaded or modified.
      </p>
    </div>
  )
}
