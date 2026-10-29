import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60'

export const cardCls =
  'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'

export const panelCls =
  'rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300"
    >
      {children}
    </button>
  )
}

export function LoadingNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-600 dark:text-slate-400">
      <Loader2 size={18} className="animate-spin" />
      {children}
    </div>
  )
}
