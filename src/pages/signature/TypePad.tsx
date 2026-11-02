import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import ShareButton from '../../components/ShareButton'
import { t } from '../../utils/i18n'
import { ColorSwatches, downloadCanvasPng, penBtn, PEN_COLORS } from './shared'

const FONTS = [
  {
    id: 'script',
    style: 'normal',
    stack: '"Segoe Script", "Lucida Handwriting", "Brush Script MT", cursive',
  },
  {
    id: 'casual',
    style: 'normal',
    stack: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive',
  },
  {
    id: 'serif',
    style: 'italic',
    stack: 'Georgia, "Times New Roman", serif',
  },
] as const

const PAD = 60

export default function TypePad() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState('')
  const [fontId, setFontId] = useState<(typeof FONTS)[number]['id']>('script')
  const [color, setColor] = useState(PEN_COLORS[0])
  const [size, setSize] = useState(96)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0]
    const content = text.trim()
    if (!content) {
      canvas.width = 1
      canvas.height = 1
      return
    }
    ctx.font = `${font.style} ${size}px ${font.stack}`
    const metrics = ctx.measureText(content)
    canvas.width = Math.ceil(metrics.width) + PAD * 2
    canvas.height = Math.ceil(size * 1.9)
    ctx.font = `${font.style} ${size}px ${font.stack}`
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.fillText(content, PAD, canvas.height / 2)
  }, [text, fontId, color, size])

  const hasText = text.trim().length > 0

  const seg = (id: (typeof FONTS)[number]['id'], label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setFontId(id)}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        fontId === id
          ? 'bg-slate-200 text-slate-900 shadow dark:bg-slate-800 dark:text-white'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('Type your signature')}
        maxLength={60}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-lg outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950/60"
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
          {seg('script', 'Script')}
          {seg('casual', 'Casual')}
          {seg('serif', 'Serif Italic')}
        </div>
        <ColorSwatches value={color} onChange={setColor} />
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          {t('Size')}
          <input
            type="range"
            min={48}
            max={160}
            step={4}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-28 accent-sky-600"
          />
        </label>
      </div>

      <div className="flex min-h-40 items-center justify-center overflow-x-auto rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700">
        {hasText ? (
          <canvas ref={canvasRef} className="max-w-full" />
        ) : (
          <span className="text-sm text-slate-400">{t('Type your signature')}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const canvas = canvasRef.current
            if (canvas) downloadCanvasPng(canvas, 'signature.png')
          }}
          disabled={!hasText}
          className={penBtn}
        >
          <Download size={16} />
          {t('Download PNG')}
        </button>
        <ShareButton
          disabled={!hasText}
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
