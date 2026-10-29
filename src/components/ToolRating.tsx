import { useEffect, useState } from 'react'
import { MessageSquare, Star } from 'lucide-react'
import { buildToolSchema, fetchToolAggregate, loadRating, saveRating, submitToolRating } from '../lib/ratings'
import type { ToolAggregate } from '../lib/ratings'
import { t } from '../utils/i18n'

const JSONLD_ID = 'utility-hub-tool-jsonld'

interface Props {
  toolId: string
  toolName: string
}

export default function ToolRating({ toolId, toolName }: Props) {
  const [data, setData] = useState(() => loadRating(toolId))
  const [global, setGlobal] = useState<ToolAggregate | null>(null)
  const [hover, setHover] = useState(0)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [draft, setDraft] = useState(data.review)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchToolAggregate(toolId).then((agg) => {
      if (!cancelled && agg) setGlobal(agg)
    })
    return () => {
      cancelled = true
    }
  }, [toolId])

  const avg = global?.averageScore ?? data.rating
  const count = global?.ratingCount ?? (data.rating > 0 ? 1 : 0)

  useEffect(() => {
    let script = document.getElementById(JSONLD_ID) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = JSONLD_ID
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(
      buildToolSchema(
        toolName,
        `${window.location.origin}${window.location.pathname}`,
        avg,
        count,
      ),
    )
    return () => {
      document.getElementById(JSONLD_ID)?.remove()
    }
  }, [toolId, toolName, avg, count])

  const flashSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const rate = (rating: number) => {
    const previous = data.rating
    setData(saveRating(toolId, rating, data.review))
    void submitToolRating(toolId, rating, previous)
    setGlobal((g) => {
      const sum = (g?.averageScore ?? 0) * (g?.ratingCount ?? 0) + rating - previous
      const n = (g?.ratingCount ?? 0) + (previous < 1 ? 1 : 0)
      return n > 0 ? { averageScore: sum / n, ratingCount: n } : null
    })
    flashSaved()
  }

  const submitReview = () => {
    setData(saveRating(toolId, data.rating, draft.trim()))
    setReviewOpen(false)
    flashSaved()
  }

  const shown = hover || data.rating

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 print:hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('Rate this tool')}
        </span>
        <div
          role="radiogroup"
          aria-label={t('Rate this tool')}
          className="flex items-center"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={data.rating === n}
              aria-label={t('Rate {n} stars', { n })}
              onClick={() => rate(n)}
              onMouseEnter={() => setHover(n)}
              className="rounded p-1 transition-transform hover:scale-110"
            >
              <Star
                size={19}
                className={
                  shown >= n
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {count > 0 ? (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {avg.toFixed(1)}
              </span>{' '}
              {t('Average rating')} · {count} {t(count === 1 ? 'rating' : 'ratings')}
            </>
          ) : (
            t('Not rated yet')
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setDraft(data.review)
            setReviewOpen((open) => !open)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-sky-600 transition hover:bg-sky-500/10 dark:text-sky-400"
        >
          <MessageSquare size={13} />
          {t(reviewOpen ? 'Hide review' : 'Leave a review')}
        </button>
        {saved && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {t('Saved locally')}
          </span>
        )}
      </div>
      {data.review && !reviewOpen && (
        <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
          “{data.review}”
        </p>
      )}
      {reviewOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder={t('Your review (optional)…')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60"
          />
          <button
            type="button"
            onClick={submitReview}
            className="inline-flex h-9 items-center rounded-lg bg-sky-500 px-4 text-xs font-semibold text-white transition hover:bg-sky-400"
          >
            {t('Submit Rating')}
          </button>
          <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800/60">
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {t('How ratings work')}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {t('Ratings and optional reviews are saved locally on your device for immediate access and synced anonymously to our secure cloud index to display aggregate community scores. We collect zero personal data, zero user accounts, and zero IP addresses.')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
