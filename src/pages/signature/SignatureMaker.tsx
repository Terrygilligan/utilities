import { useState } from 'react'
import { PenLine, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '../../utils/i18n'
import DrawPad from './DrawPad'
import TypePad from './TypePad'

type Mode = 'draw' | 'type'

export default function SignatureMaker() {
  const [mode, setMode] = useState<Mode>('draw')

  const seg = (id: Mode, label: string, Icon: LucideIcon) => (
    <button
      key={id}
      type="button"
      onClick={() => setMode(id)}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
        mode === id
          ? 'bg-slate-200 text-slate-900 shadow dark:bg-slate-800 dark:text-white'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      <Icon size={15} />
      {t(label)}
    </button>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Signature Maker')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Draw or type your signature and export it as a transparent PNG or SVG — ready to drop into PDFs and documents.',
        )}
      </p>

      <div className="mt-6 flex max-w-md rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {seg('draw', 'Draw', PenLine)}
        {seg('type', 'Type', Type)}
      </div>

      <div className="mt-6">{mode === 'draw' ? <DrawPad /> : <TypePad />}</div>
    </div>
  )
}
