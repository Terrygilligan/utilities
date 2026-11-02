import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Download, FileCode2, Undo2 } from 'lucide-react'
import ShareButton from '../../components/ShareButton'
import { saveBlob } from '../../lib/download'
import { t } from '../../utils/i18n'
import { ColorSwatches, downloadCanvasPng, penBtn, PEN_COLORS } from './shared'

const W = 1200
const H = 480
const WIDTHS = [2, 4, 7]

interface Pt {
  x: number
  y: number
}

interface Stroke {
  color: string
  width: number
  points: Pt[]
}

const paintStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
  const pts = s.points
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineWidth = s.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0].x, pts[0].y, s.width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
  ctx.stroke()
}

const strokeToSvg = (s: Stroke): string => {
  const pts = s.points
  if (pts.length === 1) {
    return `<circle cx="${pts[0].x.toFixed(1)}" cy="${pts[0].y.toFixed(1)}" r="${(s.width / 2).toFixed(1)}" fill="${s.color}"/>`
  }
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = ((pts[i].x + pts[i + 1].x) / 2).toFixed(1)
    const my = ((pts[i].y + pts[i + 1].y) / 2).toFixed(1)
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx} ${my}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`
  return `<path d="${d}" stroke="${s.color}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
}

export default function DrawPad() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const [color, setColor] = useState(PEN_COLORS[0])
  const [width, setWidth] = useState(4)
  const [hasInk, setHasInk] = useState(false)

  const pos = (e: ReactPointerEvent<HTMLCanvasElement>): Pt => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    }
  }

  const redrawAll = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    for (const s of strokesRef.current) paintStroke(ctx, s)
  }

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = { color, width, points: [pos(e)] }
  }

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = drawingRef.current
    if (!stroke) return
    stroke.points.push(pos(e))
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) paintStroke(ctx, stroke)
  }

  const onUp = () => {
    const stroke = drawingRef.current
    drawingRef.current = null
    if (stroke && stroke.points.length > 0) {
      strokesRef.current.push(stroke)
      setHasInk(true)
    }
  }

  const undo = () => {
    strokesRef.current.pop()
    redrawAll()
    setHasInk(strokesRef.current.length > 0)
  }

  const clear = () => {
    strokesRef.current = []
    redrawAll()
    setHasInk(false)
  }

  const exportSvg = () => {
    const body = strokesRef.current.map(strokeToSvg).join('\n  ')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">\n  ${body}\n</svg>\n`
    saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'signature.svg')
  }

  const smallBtn =
    'inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <ColorSwatches value={color} onChange={setColor} />
        <div className="flex items-center gap-1.5" role="group" aria-label={t('Pen size')}>
          {WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              className={`flex h-8 w-9 items-center justify-center rounded-md transition ${
                width === w
                  ? 'bg-slate-200 dark:bg-slate-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span
                className="rounded-full bg-slate-700 dark:bg-slate-200"
                style={{ width: w * 2, height: w * 2 }}
              />
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={undo} disabled={!hasInk} className={smallBtn}>
            <Undo2 size={14} />
            {t('Undo')}
          </button>
          <button type="button" onClick={clear} disabled={!hasInk} className={smallBtn}>
            {t('Clear')}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 bg-white p-2 dark:border-slate-700">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="block h-40 w-full touch-none rounded-lg sm:h-48"
          aria-label={t('Draw your signature in the box below.')}
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('Draw your signature in the box below.')}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const canvas = canvasRef.current
            if (canvas) downloadCanvasPng(canvas, 'signature.png')
          }}
          disabled={!hasInk}
          className={penBtn}
        >
          <Download size={16} />
          {t('Download PNG')}
        </button>
        <button type="button" onClick={exportSvg} disabled={!hasInk} className={penBtn}>
          <FileCode2 size={16} />
          {t('Download SVG')}
        </button>
        <ShareButton
          disabled={!hasInk}
          payload={() =>
            new Promise((resolve) => {
              canvasRef.current?.toBlob((blob) => {
                resolve(
                  blob
                    ? {
                        kind: 'file' as const,
                        file: new File([blob], 'signature.png', { type: 'image/png' }),
                      }
                    : null,
                )
              }, 'image/png')
            })
          }
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('The PNG keeps a transparent background — drop it onto PDFs, images or documents.')}
      </p>
    </div>
  )
}
