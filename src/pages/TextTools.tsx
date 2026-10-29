import { useMemo, useState } from 'react'
import { Check, Copy, Shuffle } from 'lucide-react'
import ShareButton from '../components/ShareButton'
import { fmtNumber } from '../utils/locale'
import { t } from '../utils/i18n'

const LOREM = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'
const collator = new Intl.Collator(undefined, { sensitivity: 'base' })

const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
const titleCase = (s: string) => s.replace(/\p{L}\S*/gu, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
const camel = (s: string) => words(s).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('')
const delim = (s: string, d: string) => words(s).join(d)
const slug = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')

export default function TextTools() {
  const [text, setText] = useState('')
  const [paragraphs, setParagraphs] = useState(3)
  const [copied, setCopied] = useState(false)

  const stats = useMemo(() => {
    const w = words(text)
    return {
      words: w.length,
      chars: text.length,
      charsNoSpace: text.replace(/\s/g, '').length,
      lines: text ? text.split('\n').length : 0,
      sentences: (text.match(/[.!?]+/g) ?? []).length || (w.length ? 1 : 0),
      minutes: Math.max(1, Math.round(w.length / 200)),
    }
  }, [text])

  const btn = 'h-9 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

  const ops: [string, (s: string) => string][] = [
    ['UPPERCASE', (s) => s.toUpperCase()],
    ['lowercase', (s) => s.toLowerCase()],
    ['Title Case', titleCase],
    ['camelCase', camel],
    ['kebab-case', (s) => delim(s, '-')],
    ['snake_case', (s) => delim(s, '_')],
    ['slugify', slug],
  ]
  const lineOps: [string, (s: string) => string][] = [
    ['Sort A→Z', (s) => s.split('\n').sort(collator.compare).join('\n')],
    ['Reverse lines', (s) => s.split('\n').reverse().join('\n')],
    ['Dedupe', (s) => [...new Set(s.split('\n'))].join('\n')],
    ['Remove blanks', (s) => s.split('\n').filter((l) => l.trim()).join('\n')],
    ['Trim lines', (s) => s.split('\n').map((l) => l.trim()).join('\n')],
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Text Workbench')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Case conversion, line operations, word counts, and lorem ipsum — all instant and local.')}
      </p>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} spellCheck={false}
        placeholder={t('Type or paste text here…')}
        className="mt-6 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-950/60" />

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{fmtNumber(stats.words)} {t('words')}</span>
        <span>{fmtNumber(stats.chars)} {t('chars')}</span>
        <span>{fmtNumber(stats.charsNoSpace)} {t('w/o spaces')}</span>
        <span>{fmtNumber(stats.lines)} {t('lines')}</span>
        <span>{fmtNumber(stats.sentences)} {t('sentences')}</span>
        <span>~{fmtNumber(stats.minutes)} {t('min read')}</span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {ops.map(([label, fn]) => (
            <button key={label} type="button" disabled={!text} onClick={() => setText(fn(text))} className={btn}>{t(label)}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {lineOps.map(([label, fn]) => (
            <button key={label} type="button" disabled={!text} onClick={() => setText(fn(text))} className={btn}>{t(label)}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={!text}
          onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t('Copied!') : t('Copy')}
        </button>
        <ShareButton disabled={!text} payload={() => text ? { kind: 'text', text } : null} />
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <Shuffle size={14} className="text-slate-500" /> Lorem
          <input type="number" min={1} max={10} value={paragraphs}
            onChange={(e) => setParagraphs(Math.max(1, Math.min(10, +e.target.value)))}
            className="h-9 w-14 rounded-lg border border-slate-300 bg-white px-2 text-center dark:border-slate-700 dark:bg-slate-950/60" />
          <button type="button" onClick={() => setText((t) => (t ? t + '\n\n' : '') + Array.from({ length: paragraphs }, () => LOREM).join(' '))}
            className={btn}>{t('Generate')}</button>
        </label>
      </div>
    </div>
  )
}
