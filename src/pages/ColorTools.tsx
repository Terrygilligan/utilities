import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function ratio(a: [number, number, number], b: [number, number, number]) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')

function palette(hex: string): string[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return []
  const [r, g, b] = rgb
  return [0.85, 0.6, 0.35, 0.15, 0].map((t) =>
    t === 0 ? hex.toUpperCase() : rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t),
  ).concat([-0.2, -0.45].map((t) => rgbToHex(r * (1 + t), g * (1 + t), b * (1 + t))))
}

function Swatch({ hex }: { hex: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" title={`Copy ${hex}`}
      onClick={async () => { await navigator.clipboard.writeText(hex); setOk(true); setTimeout(() => setOk(false), 1200) }}
      className="group relative h-14 flex-1 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
      style={{ backgroundColor: hex }}>
      <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center font-mono text-[10px] text-white opacity-0 transition group-hover:opacity-100">
        {ok ? <Check size={10} className="inline" /> : hex}
      </span>
    </button>
  )
}

function Pass({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${pass ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/15 text-red-700 dark:text-red-400'}`}>
      {label} {pass ? 'PASS' : 'FAIL'}
    </span>
  )
}

export default function ColorTools() {
  const [color, setColor] = useState('#0284c7')
  const [bg, setBg] = useState('#0f172a')

  const rgb = hexToRgb(color)
  const bgRgb = hexToRgb(bg)
  const r = rgb && bgRgb ? ratio(rgb, bgRgb) : null
  const shades = useMemo(() => palette(color), [color])

  const inputCls = 'h-10 w-28 rounded-lg border border-slate-300 bg-white px-2 font-mono text-sm uppercase dark:border-slate-700 dark:bg-slate-950/60'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Color Tools</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Pick colors, generate tints/shades, and check WCAG 2.2 contrast — all offline.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Picker &amp; palette</h2>
          <div className="mt-3 flex items-center gap-3">
            <input type="color" value={rgb ? color : '#0284c7'} onChange={(e) => setColor(e.target.value)}
              className="h-12 w-16 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700" />
            <input value={color} onChange={(e) => setColor(e.target.value)} spellCheck={false} className={inputCls} />
            <span className="font-mono text-xs text-slate-500">
              {rgb ? `rgb(${rgb.join(', ')})` : 'invalid hex'}
            </span>
          </div>
          <div className="mt-4 flex gap-1.5">
            {shades.map((s) => <Swatch key={s} hex={s} />)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Click a swatch to copy its hex.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">WCAG 2.2 contrast</h2>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs text-slate-500">Text
              <input value={color} onChange={(e) => setColor(e.target.value)} spellCheck={false} className={`${inputCls} mt-1 block w-full`} />
            </label>
            <label className="text-xs text-slate-500">Background
              <input value={bg} onChange={(e) => setBg(e.target.value)} spellCheck={false} className={`${inputCls} mt-1 block w-full`} />
            </label>
            <input type="color" value={bgRgb ? bg : '#0f172a'} onChange={(e) => setBg(e.target.value)}
              className="mt-4 h-10 w-14 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700" />
          </div>
          {r !== null && (
            <>
              <p className="mt-4 font-mono text-2xl font-bold text-sky-600 dark:text-sky-400">
                {r.toFixed(2)}:1
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pass pass={r >= 4.5} label="AA normal" />
                <Pass pass={r >= 7} label="AAA normal" />
                <Pass pass={r >= 3} label="AA large" />
                <Pass pass={r >= 4.5} label="AAA large" />
              </div>
              <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: bgRgb ? bg : '#000' }}>
                <p className="text-sm" style={{ color: rgb ? color : '#fff' }}>Normal text sample (14px)</p>
                <p className="text-xl font-bold" style={{ color: rgb ? color : '#fff' }}>Large text sample</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
