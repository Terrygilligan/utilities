import { useEffect, useState } from 'react'
import { ArrowUpDown, Sparkles, Star } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import UpdateBanner from '../components/UpdateBanner'
import { readFavorites, readOrder, resolveOrder, writeFavorites, writeOrder } from '../lib/dashboard'
import { fetchAllToolAggregates } from '../lib/ratings'
import type { ToolAggregate } from '../lib/ratings'
import { TOOLS } from '../lib/tools'
import type { Tool } from '../lib/tools'
import { t } from '../utils/i18n'

const DEFAULT_ORDER = TOOLS.map((tool) => tool.id)

export default function Home() {
  const [favorites, setFavorites] = useState<string[]>(readFavorites)
  const [order, setOrder] = useState<string[]>(() => resolveOrder(readOrder(), DEFAULT_ORDER))
  const [reordering, setReordering] = useState(false)
  const [aggregates, setAggregates] = useState<Map<string, ToolAggregate>>(new Map())

  useEffect(() => {
    let cancelled = false
    void fetchAllToolAggregates().then((map) => {
      if (!cancelled) setAggregates(map)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleFavorite = (id: string) =>
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((f) => f !== id) : [...current, id]
      writeFavorites(next)
      return next
    })

  const move = (id: string, dir: -1 | 1) =>
    setOrder((current) => {
      const i = current.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= current.length) return current
      const next = [...current]
      const tmp = next[i]
      next[i] = next[j]
      next[j] = tmp
      writeOrder(next)
      return next
    })

  const byId = new Map(TOOLS.map((tool) => [tool.id, tool]))
  const ordered = order
    .map((id) => byId.get(id))
    .filter((tool): tool is Tool => tool !== undefined)
  const favSet = new Set(favorites)
  const favTools = ordered.filter((tool) => favSet.has(tool.id))

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('What do you need today?')}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            {t('A growing collection of everyday utilities that run entirely in your browser — no uploads, no accounts, works offline once installed.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReordering((on) => !on)}
          aria-pressed={reordering}
          className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
            reordering
              ? 'bg-sky-500/15 text-sky-600 hover:bg-sky-500/25 dark:text-sky-400'
              : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowUpDown size={15} />
          {reordering ? t('Done') : t('Reorder tools')}
        </button>
      </div>

      <UpdateBanner />

      {favTools.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {t('Favorites')}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favTools.map((tool) => (
              <ToolCard
                key={tool.id}
                to={tool.to}
                title={t(tool.title)}
                description={t(tool.description)}
                icon={tool.icon}
                favorite
                ratingAvg={aggregates.get(tool.id.slice(1))?.averageScore}
                ratingCount={aggregates.get(tool.id.slice(1))?.ratingCount}
                onToggleFavorite={() => toggleFavorite(tool.id)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((tool, i) => (
          <ToolCard
            key={tool.id}
            to={tool.to}
            title={t(tool.title)}
            description={t(tool.description)}
            icon={tool.icon}
            favorite={favSet.has(tool.id)}
            ratingAvg={aggregates.get(tool.id.slice(1))?.averageScore}
            ratingCount={aggregates.get(tool.id.slice(1))?.ratingCount}
            onToggleFavorite={() => toggleFavorite(tool.id)}
            reordering={reordering}
            onMoveUp={() => move(tool.id, -1)}
            onMoveDown={() => move(tool.id, 1)}
            first={i === 0}
            last={i === ordered.length - 1}
          />
        ))}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
          <Sparkles size={22} className="text-slate-400 dark:text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            {t('More tools coming soon')}
          </p>
        </div>
      </div>
    </div>
  )
}
