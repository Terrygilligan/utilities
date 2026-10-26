import { useMemo, useState } from 'react'
import { Check, Copy, FileCode2, Download } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import { saveBlob, baseName } from '../lib/download'

const EDITOR_ATTRS = /^(xmlns:(inkscape|sodipodi|adobe)|inkscape:|sodipodi:|data-name)/
const STRIP_TAGS = /<(metadata|title|desc)[\s\S]*?<\/\1>/g

function optimize(src: string): string {
  let out = src
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(STRIP_TAGS, '')
  const doc = new DOMParser().parseFromString(out, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg || doc.querySelector('parsererror')) return out.replace(/>\s+</g, '><').trim()
  const walk = (el: Element) => {
    for (const attr of [...el.attributes]) {
      if (EDITOR_ATTRS.test(attr.name) || attr.value.trim() === '') el.removeAttribute(attr.name)
    }
    for (const child of [...el.children]) walk(child)
  }
  walk(svg)
  return new XMLSerializer()
    .serializeToString(svg)
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

export default function SvgOptimizer() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const output = useMemo(() => (input.trim() ? optimize(input) : ''), [input])
  const saved = input && output ? 100 - Math.round((output.length / input.length) * 100) : 0

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">SVG Optimizer</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Strip comments, XML prologs, editor metadata (Inkscape/Sodipodi), and empty attributes — pure local cleanup.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <FilePicker
            accept=".svg,image/svg+xml"
            title="Drop an SVG file"
            icon={FileCode2}
            onFiles={(files) => {
              if (files[0]) void files[0].text().then(setInput)
            }}
          />
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={12} spellCheck={false}
            placeholder="…or paste raw SVG markup here"
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-950/60" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {output ? `${input.length.toLocaleString()} → ${output.length.toLocaleString()} chars` : 'Output'}
              {saved > 0 && <b className="ml-2 text-emerald-600 dark:text-emerald-400">−{saved}%</b>}
            </span>
            <span className="flex gap-2">
              <button type="button" disabled={!output}
                onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium hover:bg-slate-200 disabled:opacity-40 dark:hover:bg-slate-800">
                {copied ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />} Copy
              </button>
              <button type="button" disabled={!output}
                onClick={() => saveBlob(new Blob([output], { type: 'image/svg+xml' }), `${baseName('optimized')}.svg`)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium hover:bg-slate-200 disabled:opacity-40 dark:hover:bg-slate-800">
                <Download size={13} /> Save
              </button>
            </span>
          </div>
          <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-slate-100 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all dark:bg-slate-950/60">
            {output || <span className="text-slate-400">Cleaned SVG appears here…</span>}
          </pre>
          {output && (
            <div className="mt-3 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              {/* eslint-disable-next-line react/no-danger */}
              <div className="max-h-40 max-w-full" dangerouslySetInnerHTML={{ __html: output }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
