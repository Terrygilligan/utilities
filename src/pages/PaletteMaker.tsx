import { useCallback, useRef, useState } from 'react'
import {
  Check,
  Code2,
  Download,
  Image as ImageIcon,
  Loader2,
  Pipette,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { baseName, saveBlob } from '../lib/download'
import { t } from '../utils/i18n'

interface RGB {
  r: number
  g: number
  b: number
}

interface Swatch {
  color: RGB
  count: number
}

const SAMPLE_MAX = 160
const SIZES = [4, 6, 8]

const channelRanges = (pixels: RGB[]): [number, number] => {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0
  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r
    if (p.r > rMax) rMax = p.r
    if (p.g < gMin) gMin = p.g
    if (p.g > gMax) gMax = p.g
    if (p.b < bMin) bMin = p.b
    if (p.b > bMax) bMax = p.b
  }
  const ranges = [rMax - rMin, gMax - gMin, bMax - bMin]
  const channel = ranges.indexOf(Math.max(...ranges))
  return [channel, Math.max(...ranges)]
}

const buildPalette = (pixels: RGB[], count: number): Swatch[] => {
  if (!pixels.length) return []
  const buckets: RGB[][] = [pixels]
  while (buckets.length < count) {
    let widest = -1
    let widestRange = 0
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].length < 2) continue
      const [, range] = channelRanges(buckets[i])
      if (range > widestRange) {
        widestRange = range
        widest = i
      }
    }
    if (widest < 0) break
    const bucket = buckets[widest]
    const [channel] = channelRanges(bucket)
    const key = (['r', 'g', 'b'] as const)[channel]
    const sorted = [...bucket].sort((a, b) => a[key] - b[key])
    const mid = Math.max(1, Math.floor(sorted.length / 2))
    buckets.splice(widest, 1, sorted.slice(0, mid), sorted.slice(mid))
  }
  return buckets
    .filter((b) => b.length > 0)
    .map((b) => {
      let r = 0, g = 0, bl = 0
      for (const p of b) {
        r += p.r
        g += p.g
        bl += p.b
      }
      return {
        color: {
          r: Math.round(r / b.length),
          g: Math.round(g / b.length),
          b: Math.round(bl / b.length),
        },
        count: b.length,
      }
    })
    .sort((a, b) => b.count - a.count)
}

const toHex = ({ r, g, b }: RGB) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`

const toHsl = ({ r, g, b }: RGB): [number, number, number] => {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
  else if (max === gn) h = ((bn - rn) / d + 2) * 60
  else h = ((rn - gn) / d + 4) * 60
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
}

export default function PaletteMaker() {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [imgName, setImgName] = useState('')
  const [palette, setPalette] = useState<Swatch[]>([])
  const [total, setTotal] = useState(0)
  const [size, setSize] = useState(6)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const pixelsRef = useRef<RGB[]>([])
  const urlRef = useRef<string | null>(null)

  const extract = useCallback(
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
        const scale = Math.min(1, SAMPLE_MAX / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setError(t('Could not read that image.'))
          setBusy(false)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h).data
        const pixels: RGB[] = []
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue
          pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
        }
        if (!pixels.length) {
          setError(t('Could not read that image.'))
          setBusy(false)
          return
        }
        pixelsRef.current = pixels
        setTotal(pixels.length)
        setPalette(buildPalette(pixels, size))
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
    [size],
  )

  const recompute = (n: number) => {
    setSize(n)
    setPalette(buildPalette(pixelsRef.current, n))
  }

  const clear = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setImgUrl(null)
    setImgName('')
    setPalette([])
    setTotal(0)
    pixelsRef.current = []
    setError(null)
  }

  const flash = (key: string) => {
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey(null), 1500)
  }

  const cssVars = () =>
    palette.map((s, i) => `--palette-${i + 1}: ${toHex(s.color)};`).join('\n')

  const txtExport = () =>
    palette
      .map((s, i) => {
        const { r, g, b } = s.color
        const [h, sl, l] = toHsl(s.color)
        const pct = ((s.count / total) * 100).toFixed(1)
        return `${toHex(s.color)}  rgb(${r}, ${g}, ${b})  hsl(${h}, ${sl}%, ${l}%)  ${pct}%  (color ${i + 1})`
      })
      .join('\n')

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-400'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Image Color Palette')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Extract the dominant colors from any photo — click a swatch to copy its hex code, or export the whole palette.',
        )}
      </p>

      {!imgUrl && (
        <div className="mt-6">
          <FilePicker
            accept="image/*"
            onFiles={extract}
            icon={ImageIcon}
            title={t('Drop an image here or click to choose')}
            subtitle={t('Pixels are sampled on your device — nothing is uploaded.')}
          />
        </div>
      )}

      {busy && (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          {t('Extracting colors…')}
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
            <img
              src={imgUrl}
              alt={imgName}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{imgName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('Palette size')}
              </p>
            </div>
            <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
              {SIZES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => recompute(n)}
                  className={`h-8 w-9 rounded-md text-xs font-medium transition ${
                    size === n
                      ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {palette.map((s, i) => {
              const hex = toHex(s.color)
              const { r, g, b } = s.color
              const [h, sl, l] = toHsl(s.color)
              const pct = (s.count / total) * 100
              const light = r * 0.299 + g * 0.587 + b * 0.114 > 150
              return (
                <button
                  key={hex + i}
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(hex)
                    flash(hex + i)
                  }}
                  className="overflow-hidden rounded-xl border border-slate-200 text-left transition hover:scale-[1.02] dark:border-slate-700"
                  style={{ backgroundColor: hex }}
                  title={t('Click to copy')}
                >
                  <div className="flex h-20 items-end justify-between p-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${
                        light ? 'bg-white/80 text-slate-900' : 'bg-black/50 text-white'
                      }`}
                    >
                      {copiedKey === hex + i ? (
                        <Check size={12} className="inline" />
                      ) : (
                        hex
                      )}
                    </span>
                  </div>
                  <div className="bg-white px-2 py-1.5 dark:bg-slate-900">
                    <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      rgb({r},{g},{b}) · hsl({h},{sl}%,{l}%)
                    </p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Pipette size={13} />
            {t('Bars show how much of the image each color covers.')}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(cssVars())
                flash('css')
              }}
              className={btn}
            >
              {copiedKey === 'css' ? <Check size={16} /> : <Code2 size={16} />}
              {copiedKey === 'css' ? t('Copied!') : t('Copy CSS variables')}
            </button>
            <button
              type="button"
              onClick={() =>
                saveBlob(
                  new Blob([txtExport()], { type: 'text/plain;charset=utf-8' }),
                  `${baseName(imgName || 'palette')}-palette.txt`,
                )
              }
              className={btn}
            >
              <Download size={16} />
              {t('Download')}
            </button>
            <ShareButton
              payload={() => ({ kind: 'text', text: cssVars(), title: imgName })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
