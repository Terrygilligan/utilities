import { useMemo, useState } from 'react'
import { Braces, Check, Copy, Regex } from 'lucide-react'
import { fmtNumber } from '../utils/locale'

type Tab = 'regex' | 'json'

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" disabled={!text}
      onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500) }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
      {ok ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} />} Copy
    </button>
  )
}

function RegexPanel() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [test, setTest] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { html, count } = useMemo(() => {
    if (!pattern || !test) return { html: null, count: 0 }
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      setError(null)
      let count = 0
      const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
      const html = test.replace(re, (m) => {
        count++
        return m ? `\u0000${esc(m)}\u0001` : esc(m)
      })
      const out = esc(html)
        .replace(/\u0000/g, '<mark class="rounded bg-sky-500/30 px-0.5 text-sky-800 dark:text-sky-200">')
        .replace(/\u0001/g, '</mark>')
      return { html: out, count }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid regex')
      return { html: null, count: 0 }
    }
  }, [pattern, flags, test])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={pattern} onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern e.g. \b\w+@\w+\.\w+\b" spellCheck={false}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950/60" />
          <input value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^dgimsuvy]/g, ''))}
            placeholder="flags" spellCheck={false} title="flags: g i m s u y"
            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-mono text-sm dark:border-slate-700 dark:bg-slate-950/60" />
        </div>
        <textarea value={test} onChange={(e) => setTest(e.target.value)} rows={10}
          placeholder="Paste test text here…" spellCheck={false}
          className="w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-950/60" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{fmtNumber(count)} match{count === 1 ? '' : 'es'}</span>
          <CopyBtn text={test} />
        </div>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-2 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200"
          dangerouslySetInnerHTML={{ __html: html ?? '<span class="text-slate-400 dark:text-slate-600">Matches will be highlighted here.</span>' }} />
      </div>
    </div>
  )
}

function JsonPanel() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = (mode: 'pretty' | 'min' | 'validate') => {
    try {
      const parsed = JSON.parse(input)
      setError(null)
      setOutput(mode === 'min' ? JSON.stringify(parsed) : mode === 'pretty' ? JSON.stringify(parsed, null, 2) : 'Valid JSON')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
      setOutput('')
    }
  }

  const btn = 'h-9 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={14} spellCheck={false}
        placeholder='{"paste": "JSON here"}'
        className="w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-950/60" />
      <div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => run('pretty')} className={btn}>Format</button>
          <button type="button" onClick={() => run('min')} className={btn}>Minify</button>
          <button type="button" onClick={() => run('validate')} className={btn}>Validate</button>
          <CopyBtn text={output} />
        </div>
        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">{output}</pre>
      </div>
    </div>
  )
}

export default function CodePlayground() {
  const [tab, setTab] = useState<Tab>('regex')
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Regex &amp; JSON Playground</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Test regex patterns with live highlighting, or format / validate / minify JSON. Nothing leaves the browser.
      </p>
      <div role="tablist" className="mt-6 flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {([{ id: 'regex', label: 'Regex tester', icon: Regex }, { id: 'json', label: 'JSON tools', icon: Braces }] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition sm:text-sm ${tab === id ? 'bg-slate-200 text-slate-900 shadow dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tab === 'regex' ? <RegexPanel /> : <JsonPanel />}</div>
    </div>
  )
}
