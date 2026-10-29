import { useMemo, useState } from 'react'
import { Check, Copy, FileCode } from 'lucide-react'
import ShareButton from '../components/ShareButton'
import { t } from '../utils/i18n'

const b64encode = (s: string) => btoa(unescape(encodeURIComponent(s)))
const b64decode = (s: string) => decodeURIComponent(escape(atob(s.trim().replace(/\s/g, ''))))

export default function Base64Tools() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [lastOp, setLastOp] = useState('')

  const [output, error] = useMemo<[string, string | null]>(() => {
    if (!input || !lastOp) return ['', null]
    try {
      switch (lastOp) {
        case 'b64e': return [b64encode(input), null]
        case 'b64d': return [b64decode(input), null]
        case 'urle': return [encodeURIComponent(input), null]
        case 'urld': return [decodeURIComponent(input), null]
      }
    } catch {
      return ['', lastOp === 'b64d'
        ? t('Can\'t decode that input — check it\'s valid Base64 text.')
        : lastOp === 'urld'
          ? t('Can\'t decode that input — check it\'s valid percent-encoded text.')
          : t('Can\'t encode that input.')]
    }
    return ['', null]
  }, [input, lastOp])

  const btn = 'h-9 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
  const ops: [string, string][] = [
    ['b64e', 'Encode → Base64'], ['b64d', 'Decode ← Base64'],
    ['urle', 'Encode → URL'], ['urld', 'Decode ← URL'],
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Base64 & URL Codec')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Encode or decode Base64 and percent-encoded URLs — Unicode-safe, entirely in-browser.')}
      </p>

      <textarea value={input} onChange={(e) => { setInput(e.target.value); setLastOp('') }} rows={6} spellCheck={false}
        placeholder={t('Paste text, a Base64 blob, or an encoded URL…')}
        className="mt-6 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950/60" />

      <div className="mt-3 flex flex-wrap gap-2">
        {ops.map(([id, label]) => (
          <button key={id} type="button" disabled={!input} onClick={() => setLastOp(id)} className={btn}>{t(label)}</button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {output && (
        <>
          <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-800 dark:bg-slate-950/40">{output}</pre>
          <div className="mt-2 flex gap-2">
            <button type="button"
              onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400">
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t('Copied!') : t('Copy')}
            </button>
            <ShareButton payload={() => ({ kind: 'text', text: output })} />
          </div>
        </>
      )}
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <FileCode size={13} /> {t('Decoding validates input — malformed Base64/URLs surface an error instead of garbage.')}
      </p>
    </div>
  )
}
