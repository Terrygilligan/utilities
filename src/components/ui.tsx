import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

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
