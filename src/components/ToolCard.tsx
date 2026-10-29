import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, ChevronUp, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { loadRating } from '../lib/ratings'
import { t } from '../utils/i18n'

interface ToolCardProps {
  to: string
  title: string
  description: string
  icon: LucideIcon
  favorite?: boolean
  ratingAvg?: number
  ratingCount?: number
  onToggleFavorite?: () => void
  reordering?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  first?: boolean
  last?: boolean
}

const reorderBtn =
  'flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'

export default function ToolCard({
  to,
  title,
  description,
  icon: Icon,
  favorite = false,
  ratingAvg,
  ratingCount,
  onToggleFavorite,
  reordering = false,
  onMoveUp,
  onMoveDown,
  first = false,
  last = false,
}: ToolCardProps) {
  const saved = loadRating(to.replace(/^\//, ''))
  const displayCount = ratingCount ?? (saved.rating > 0 ? 1 : 0)
  const displayAvg = ratingAvg ?? saved.rating
  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white transition hover:border-slate-600 hover:bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60">
      <Link to={to} className={`flex flex-1 flex-col p-6 ${reordering ? 'pb-2' : ''}`}>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-sky-600 transition group-hover:bg-sky-500/10 dark:bg-slate-800 dark:text-sky-400">
          <Icon size={22} />
        </div>
        <h3 className="pr-8 text-base font-semibold">{title}</h3>
        {displayCount > 0 && (
          <span
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400"
            aria-label={`${displayAvg.toFixed(1)} ${t('Average rating')} · ${displayCount} ${t(displayCount === 1 ? 'rating' : 'ratings')}`}
            title={`${displayAvg.toFixed(1)} · ${displayCount} ${t(displayCount === 1 ? 'rating' : 'ratings')}`}
          >
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {displayAvg.toFixed(1)}
            <span className="text-slate-400 dark:text-slate-500">({displayCount})</span>
          </span>
        )}
        <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-400">
          {t('Open tool')}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={favorite ? t('Remove from favorites') : t('Add to favorites')}
          title={favorite ? t('Remove from favorites') : t('Add to favorites')}
          className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <Star
            size={17}
            className={
              favorite
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300 transition hover:text-slate-400 dark:text-slate-600'
            }
          />
        </button>
      )}
      {reordering && (
        <div className="flex items-center justify-end gap-0.5 px-3 pb-3">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={first}
            aria-label={t('Move up')}
            title={t('Move up')}
            className={reorderBtn}
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={last}
            aria-label={t('Move down')}
            title={t('Move down')}
            className={reorderBtn}
          >
            <ChevronDown size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
