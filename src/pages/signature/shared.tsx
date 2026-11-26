import { useState } from 'react'
import type { RefObject } from 'react'
import { Check, PenLine } from 'lucide-react'
import { saveBlob } from '../../lib/download'
import { saveSignature } from '../../lib/signature'
import { t } from '../../utils/i18n'

export const PEN_COLORS = ['#0f172a', '#1d4ed8', '#dc2626', '#047857', '#7c3aed']

export const penBtn =
  'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-400'

export function ColorSwatches({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {PEN_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={t('Pen color')}
          onClick={() => onChange(color)}
          className={`h-8 w-8 rounded-full border-2 transition ${
            value === color
              ? 'border-sky-500 scale-110'
              : 'border-slate-300 dark:border-slate-700'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

export const downloadCanvasPng = (canvas: HTMLCanvasElement, name: string) => {
  canvas.toBlob((blob) => {
    if (blob) saveBlob(blob, name)
  }, 'image/png')
}

export function SaveAsMySignature({
  canvasRef,
  disabled,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  disabled: boolean
}) {
  const [saved, setSaved] = useState(false)

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas || disabled) return
    const dataUrl = canvas.toDataURL('image/png')
    saveSignature(dataUrl)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <button type="button" onClick={save} disabled={disabled || saved} className={penBtn}>
      {saved ? <Check size={16} /> : <PenLine size={16} />}
      {saved ? t('Saved') : t('Save as my signature')}
    </button>
  )
}
