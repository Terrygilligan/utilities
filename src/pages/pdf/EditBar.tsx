import { Eraser, Highlighter, MousePointer2, PenLine, Type, Undo2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '../../utils/i18n'
import { EDIT_COLORS, TOOL_SIZES } from './editTypes'
import type { EditTool } from './editTypes'

const tools: { id: EditTool; icon: LucideIcon; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'pen', icon: PenLine, label: 'Pen' },
  { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
  { id: 'text', icon: Type, label: 'Text' },
]

const sizeLabels = ['Small', 'Medium', 'Large']
const sizeDots = [8, 12, 18]

interface Props {
  tool: EditTool
  color: string
  sizeIdx: number
  canUndo: boolean
  canClear: boolean
  onTool: (tool: EditTool) => void
  onColor: (color: string) => void
  onSizeIdx: (idx: number) => void
  onUndo: () => void
  onClear: () => void
}

export default function EditBar({
  tool,
  color,
  sizeIdx,
  canUndo,
  canClear,
  onTool,
  onColor,
  onSizeIdx,
  onUndo,
  onClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/30 px-2 py-2">
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTool(id)}
          aria-pressed={tool === id}
          title={t(label)}
          className={`flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition ${
            tool === id
              ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Icon size={16} />
          <span className="hidden md:inline">{t(label)}</span>
        </button>
      ))}

      {tool !== 'select' && (
        <>
          <span className="mx-1 hidden h-6 w-px bg-slate-300 dark:bg-slate-700 sm:block" />

          <div className="flex items-center gap-1" role="group" aria-label={t('Annotation color')}>
            {EDIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onColor(c)}
                aria-label={`${t('Annotation color')} ${c}`}
                aria-pressed={color === c}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-200 dark:hover:bg-slate-800 ${
                  color === c ? 'ring-2 ring-sky-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900' : ''
                }`}
              >
                <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: c }} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1" role="group" aria-label={t('Annotation size')}>
            {TOOL_SIZES[tool].map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => onSizeIdx(i)}
                aria-label={t(sizeLabels[i])}
                aria-pressed={sizeIdx === i}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-200 dark:hover:bg-slate-800 ${
                  sizeIdx === i ? 'bg-sky-500/20 ring-1 ring-sky-500' : ''
                }`}
              >
                <span className="rounded-full bg-slate-600 dark:bg-slate-300" style={{ width: sizeDots[i], height: sizeDots[i] }} />
              </button>
            ))}
          </div>
        </>
      )}

      <span className="mx-1 hidden h-6 w-px bg-slate-300 dark:bg-slate-700 sm:block" />

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title={t('Undo')}
        aria-label={t('Undo')}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Undo2 size={17} />
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={!canClear}
        title={t('Clear page')}
        aria-label={t('Clear page')}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Eraser size={17} />
      </button>
    </div>
  )
}
