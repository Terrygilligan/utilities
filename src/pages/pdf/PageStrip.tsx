import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { ArrowLeft, ArrowRight, Loader2, RotateCw, Trash2, Undo2 } from 'lucide-react'
import type { PageEntry } from './editTypes'
import { t } from '../../utils/i18n'

const THUMB_W = 110

async function renderThumb(pdf: PDFDocumentProxy, pageNumber: number) {
  const page = await pdf.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: THUMB_W / base.width })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const context = canvas.getContext('2d')
  if (!context) return null
  await page.render({ canvas, canvasContext: context, viewport, background: '#ffffff' }).promise
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
}

interface Props {
  pdf: PDFDocumentProxy | null
  pages: PageEntry[]
  current: number
  onSelect: (index: number) => void
  onChange: (pages: PageEntry[]) => void
}

export default function PageStrip({ pdf, pages, current, onSelect, onChange }: Props) {
  const [thumbs, setThumbs] = useState<Record<number, string>>({})
  const runIdRef = useRef(0)
  const urlsRef = useRef(new Set<string>())

  useEffect(() => {
    const runId = ++runIdRef.current
    setThumbs({})
    if (!pdf) return
    const urls = urlsRef.current
    void (async () => {
      const uniqueSrcs = [...new Set(pages.map((p) => p.src))]
      for (const src of uniqueSrcs) {
        if (runId !== runIdRef.current) return
        try {
          const blob = await renderThumb(pdf, src)
          if (!blob || runId !== runIdRef.current) return
          const url = URL.createObjectURL(blob)
          urls.add(url)
          setThumbs((cur) => ({ ...cur, [src]: url }))
        } catch {
          // skip a failed thumbnail — the strip stays usable without it
        }
      }
    })()
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [pdf])

  const move = (dir: -1 | 1) => {
    const target = current + dir
    if (target < 0 || target >= pages.length) return
    const next = [...pages]
    ;[next[current], next[target]] = [next[target], next[current]]
    onChange(next)
    onSelect(target)
  }

  const rotate = () => {
    const next = [...pages]
    next[current] = { ...next[current], rot: ((next[current].rot + 90) % 360) as PageEntry['rot'] }
    onChange(next)
  }

  const toggleDeleted = () => {
    const next = [...pages]
    next[current] = { ...next[current], deleted: !next[current].deleted }
    onChange(next)
  }

  const entry = pages[current]
  const btnCls =
    'flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5">
      <div className="flex items-center gap-1">
        <span className="mr-auto text-xs font-medium text-slate-500">{t('Organize pages')}</span>
        <button type="button" onClick={() => move(-1)} disabled={current <= 0} title={t('Move left')} aria-label={t('Move left')} className={btnCls}>
          <ArrowLeft size={16} />
        </button>
        <button type="button" onClick={() => move(1)} disabled={current >= pages.length - 1} title={t('Move right')} aria-label={t('Move right')} className={btnCls}>
          <ArrowRight size={16} />
        </button>
        <button type="button" onClick={rotate} disabled={!entry} title={t('Rotate')} aria-label={t('Rotate')} className={btnCls}>
          <RotateCw size={16} />
        </button>
        <button
          type="button"
          onClick={toggleDeleted}
          disabled={!entry}
          title={entry?.deleted ? t('Restore page') : t('Delete page')}
          aria-label={entry?.deleted ? t('Restore page') : t('Delete page')}
          className={`${btnCls} ${entry?.deleted ? 'text-emerald-600 dark:text-emerald-400' : 'hover:text-red-600 dark:hover:text-red-400'}`}
        >
          {entry?.deleted ? <Undo2 size={16} /> : <Trash2 size={16} />}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {pages.map((page, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={t('Page {n}', { n: i + 1 })}
            aria-current={i === current}
            className={`relative flex w-[76px] shrink-0 flex-col items-center gap-1 rounded-lg border p-1 transition ${
              i === current
                ? 'border-sky-500 ring-1 ring-sky-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
            } ${page.deleted ? 'opacity-40 grayscale' : ''}`}
          >
            {thumbs[page.src] ? (
              <img
                src={thumbs[page.src]}
                alt=""
                className="h-[92px] w-auto max-w-full object-contain"
                style={{ transform: `rotate(${page.rot}deg)` }}
              />
            ) : (
              <span className="flex h-[92px] w-full items-center justify-center">
                <Loader2 size={14} className="animate-spin text-slate-400" />
              </span>
            )}
            <span className="text-[10px] font-medium tabular-nums text-slate-600 dark:text-slate-400">
              {i + 1}
              {page.rot !== 0 && ` · ${page.rot}°`}
              {page.deleted && ` · ${t('deleted')}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
