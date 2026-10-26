import { useEffect, useRef, useState } from 'react'
import { Download, QrCode } from 'lucide-react'
import ShareButton from '../components/ShareButton'
import { saveBlob } from '../lib/download'

export default function QrGenerator() {
  const [text, setText] = useState('https://online-utilities.com')
  const [size, setSize] = useState(512)
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [fg, setFg] = useState('#0f172a')
  const [bg, setBg] = useState('#ffffff')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  const [pngBlob, setPngBlob] = useState<Blob | null>(null)
  const [svgText, setSvgText] = useState('')

  useEffect(() => {
    const render = async () => {
      if (!text) { setPngBlob(null); setSvgText(''); return }
      try {
        const QR = await import('qrcode')
        const opts = { width: size, errorCorrectionLevel: level, color: { dark: fg, light: bg } }
        await QR.toCanvas(canvasRef.current, text, opts)
        canvasRef.current!.toBlob((b) => setPngBlob(b), 'image/png')
        setSvgText(await QR.toString(text, { ...opts, type: 'svg' }))
        setError('')
      } catch {
        setError('Input too long for a QR code — try fewer characters or a lower error-correction level.')
      }
    }
    void render()
  }, [text, size, level, fg, bg])

  const sel = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">QR Code Generator</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Turn any text, link, or Wi-Fi string into a scannable QR code — generated entirely offline.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} spellCheck={false}
            placeholder="URL, text, WIFI:S:MyNet;T:WPA;P:pass;; …"
            className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950/60" />
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <canvas ref={canvasRef} className="mx-auto max-w-full rounded-lg" style={{ width: Math.min(size, 280) }} />
            {!text && <p className="text-xs text-slate-500">Type above to generate</p>}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="block text-xs text-slate-500">Size — {size}px
            <input type="range" min={128} max={1024} step={64} value={size} onChange={(e) => setSize(+e.target.value)} className="mt-2 w-full accent-sky-500" />
          </label>
          <label className="block text-xs text-slate-500">Error correction
            <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={`${sel} mt-1 w-full`}>
              <option value="L">Low (7%)</option><option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option><option value="H">High (30%)</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-slate-500">Foreground
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700" />
            </label>
            <label className="block text-xs text-slate-500">Background
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={!pngBlob} onClick={() => pngBlob && saveBlob(pngBlob, 'qrcode.png')}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500/15 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
              <Download size={15} /> PNG
            </button>
            <button type="button" disabled={!svgText} onClick={() => svgText && saveBlob(new Blob([svgText], { type: 'image/svg+xml' }), 'qrcode.svg')}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500/15 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
              <Download size={15} /> SVG
            </button>
            <ShareButton disabled={!pngBlob} payload={() => pngBlob ? { kind: 'file', file: new File([pngBlob], 'qrcode.png', { type: 'image/png' }) } : null} />
          </div>
        </div>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <QrCode size={13} /> Test the result instantly with our QR Scanner tool.
      </p>
    </div>
  )
}
