import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '../utils/i18n'

interface ToolCardProps {
  to: string
  title: string
  description: string
  icon: LucideIcon
}

export default function ToolCard({ to, title, description, icon: Icon }: ToolCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition hover:border-slate-600 hover:bg-slate-200/70 dark:hover:bg-slate-800/60"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 transition group-hover:bg-sky-500/10">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-400">
        {t('Open tool')}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
