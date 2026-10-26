import { useEffect, useRef, useState } from 'react'
import { Barcode, Download } from 'lucide-react'
import ShareButton from '../components/ShareButton'
import { saveBlob } from '../lib/download'

type Format = 'CODE128' | 'EAN13' | 'UPC' | 'CODE39'

const HINTS: Record<Format, string> = {
  CODE128: 'Any text or numbers — most versatile.',
  EAN13: 'Exactly 12–13 digits (retail products).',
  UPC: 'Exactly 11–12 digits (US products).',
  CODE39: 'Uppercase letters, digits, and - . space $ / + %.',
}

export default function BarcodeGenerator() {
  const [text, setText] = useState('123456789012')
  const [format, setFormat] = useState<Format>('CODE128')
  const [scale, setScale] = useState(2)
  const svgRef = useRef<SVGSVGElement>(null)
  const [error, setError] = useState('')
  const [svgOut, setSvgOut] = useState('')

  useEffect(() => {
    if (!text || !svgRef.current) return
    void (async () => {
      try {
        const JsBarcode = (await import('jsbarcode')).default
        JsBarcode(svgRef.current, text, { format, width: scale, margin: 12, fontSize: 14 })
        setSvgOut(new XMLSerializer().serializeToString(svgRef.current!))
        setError('')
      } catch {
        setSvgOut('')
        setError(`"${text}" isn't valid for ${format}. ${HINTS[format]}`)
      }
    })()
  }, [text, format, scale])

  const toPng = async (): Promise<Blob | null> => {
    if (!svgOut) return null
    const img = new Image()
    const url = URL.createObjectURL(new Blob([svgOut], { type: 'image/svg+xml' }))
    return new Promise((res) => {
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = img.width * 2; c.height = img.height * 2
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0, c.width, c.height)
        URL.revokeObjectURL(url)
        c.toBlob((b) => res(b), 'image/png')
      }
      img.src = url
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Barcode Generator</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Code 128, EAN-13, UPC, and Code 39 barcodes — rendered as SVG/PNG entirely offline.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <input value={text} onChange={(e) => setText(e.target.value)} spellCheck={false}
            placeholder="Barcode value…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-lg dark:border-slate-700 dark:bg-slate-950/60" />
          <div className="overflow-auto rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <svg ref={svgRef} className={svgOut ? 'inline-block' : 'hidden'} />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {!svgOut && !error && <p className="text-xs text-slate-500">Enter a value to generate</p>}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="block text-xs text-slate-500">Symbology
            <select value={format} onChange={(e) => setFormat(e.target.value as Format)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60">
              <option value="CODE128">Code 128</option><option value="EAN13">EAN-13</option>
              <option value="UPC">UPC-A</option><option value="CODE39">Code 39</option>
            </select>
          </label>
          <p className="text-[11px] text-slate-500">{HINTS[format]}</p>
          <label className="block text-xs text-slate-500">Bar width — {scale}px
            <input type="range" min={1} max={4} step={0.5} value={scale} onChange={(e) => setScale(+e.target.value)} className="mt-2 w-full accent-sky-500" />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={!svgOut}
              onClick={async () => { const b = await toPng(); b && saveBlob(b, 'barcode.png') }}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500/15 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
              <Download size={15} /> PNG
            </button>
            <button type="button" disabled={!svgOut} onClick={() => svgOut && saveBlob(new Blob([svgOut], { type: 'image/svg+xml' }), 'barcode.svg')}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500/15 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
              <Download size={15} /> SVG
            </button>
          </div>
          <ShareButton disabled={!svgOut} payload={async () => {
            const b = await toPng()
            return b ? { kind: 'file', file: new File([b], 'barcode.png', { type: 'image/png' }) } : null
          }} />
        </div>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Barcode size={13} /> EAN-13 auto-computes the check digit from 12 digits.
      </p>
    </div>
  )
}
