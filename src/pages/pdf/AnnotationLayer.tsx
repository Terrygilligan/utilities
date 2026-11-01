import { useCallback, useEffect, useRef, useState } from 'react'
import type { Annotation, EditTool, Pt } from './editTypes'
import { HIGHLIGHTER_ALPHA } from './editTypes'
import { t } from '../../utils/i18n'

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  a: Annotation,
  project: (p: Pt) => Pt,
  basisW: number,
  textRotation = 0,
) {
  if (a.kind === 'stroke' && a.points.length === 0) return
  ctx.save()
  if (a.kind === 'stroke') {
    ctx.globalAlpha = a.alpha
    ctx.strokeStyle = a.color
    ctx.lineWidth = Math.max(1, a.size * basisW)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const first = project(a.points[0])
    ctx.moveTo(first.x, first.y)
    for (const p of a.points.slice(1)) {
      const q = project(p)
      ctx.lineTo(q.x, q.y)
    }
    ctx.stroke()
  } else {
    const at = project(a.at)
    ctx.translate(at.x, at.y)
    if (textRotation !== 0) ctx.rotate(textRotation)
    ctx.fillStyle = a.color
    ctx.font = `${Math.max(6, a.size * basisW)}px system-ui, sans-serif`
    ctx.textBaseline = 'top'
    ctx.fillText(a.text, 0, 0)
  }
  ctx.restore()
}

interface Props {
  annotations: Annotation[]
  onAdd: (a: Annotation) => void
  tool: EditTool
  color: string
  size: number
}

export default function AnnotationLayer({ annotations, onAdd, tool, color, size }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const draftRef = useRef<Annotation | null>(null)
  const drawingRef = useRef(false)
  const [textDraft, setTextDraft] = useState<Pt | null>(null)
  const draftOpenRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(([entry]) => {
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || box.w === 0) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = Math.max(1, Math.round(box.w * dpr))
    const h = Math.max(1, Math.round(box.h * dpr))
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h
    ctx.clearRect(0, 0, w, h)
    const project = (p: Pt) => ({ x: p.x * w, y: p.y * h })
    for (const a of annotations) drawAnnotation(ctx, a, project, w)
    if (draftRef.current) drawAnnotation(ctx, draftRef.current, project, w)
  }, [annotations, box])

  useEffect(redraw, [redraw])

  const norm = (event: React.PointerEvent): Pt => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const w = rect?.width || 1
    const h = rect?.height || 1
    return {
      x: Math.min(1, Math.max(0, (event.clientX - (rect?.left ?? 0)) / w)),
      y: Math.min(1, Math.max(0, (event.clientY - (rect?.top ?? 0)) / h)),
    }
  }

  const onPointerDown = (event: React.PointerEvent) => {
    if (tool === 'select') return
    event.preventDefault()
    const p = norm(event)
    if (tool === 'text') {
      draftOpenRef.current = true
      setTextDraft(p)
      return
    }
    drawingRef.current = true
    canvasRef.current?.setPointerCapture(event.pointerId)
    draftRef.current = {
      kind: 'stroke',
      color,
      size,
      alpha: tool === 'highlighter' ? HIGHLIGHTER_ALPHA : 1,
      points: [p],
    }
    redraw()
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const draft = draftRef.current
    if (!drawingRef.current || !draft || draft.kind !== 'stroke') return
    draft.points.push(norm(event))
    redraw()
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const draft = draftRef.current
    draftRef.current = null
    if (draft && draft.kind === 'stroke' && draft.points.length > 0) {
      if (draft.points.length === 1) draft.points.push({ ...draft.points[0] })
      onAdd(draft)
    }
  }

  const commitText = (value: string) => {
    if (!draftOpenRef.current) return
    draftOpenRef.current = false
    if (textDraft && value.trim()) {
      onAdd({ kind: 'text', color, size, at: textDraft, text: value.trim() })
    }
    setTextDraft(null)
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute inset-0 size-full ${
          tool === 'select' ? 'pointer-events-none' : 'touch-none cursor-crosshair'
        }`}
      />
      {textDraft && (
        <input
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitText(event.currentTarget.value)
            if (event.key === 'Escape') {
              draftOpenRef.current = false
              setTextDraft(null)
            }
          }}
          onBlur={(event) => commitText(event.currentTarget.value)}
          placeholder={t('Type text and press Enter')}
          style={{
            left: `${textDraft.x * 100}%`,
            top: `${textDraft.y * 100}%`,
            color,
            fontSize: Math.max(12, size * box.w),
          }}
          className="absolute z-10 min-w-32 max-w-[80%] -translate-y-full rounded-md border border-sky-400 bg-white/95 px-2 py-1 shadow-lg outline-none dark:bg-slate-900/95"
        />
      )}
    </>
  )
}
