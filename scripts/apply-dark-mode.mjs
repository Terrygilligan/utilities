// One-shot codemod: dark-only classes -> light default + dark: variant.
// Exact whole-token matching; safe to re-run (mapped tokens no longer exist).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MAP = {
  'bg-slate-950/90': 'bg-white/90 dark:bg-slate-950/90',
  'bg-slate-950/60': 'bg-slate-100 dark:bg-slate-950/60',
  'bg-slate-950': 'bg-slate-50 dark:bg-slate-950',
  'bg-slate-900/60': 'bg-white dark:bg-slate-900/60',
  'bg-slate-900/50': 'bg-white/70 dark:bg-slate-900/50',
  'bg-slate-900/95': 'bg-white/95 dark:bg-slate-900/95',
  'bg-slate-900': 'bg-white dark:bg-slate-900',
  'bg-slate-800/60': 'bg-slate-200/70 dark:bg-slate-800/60',
  'bg-slate-800/30': 'bg-slate-100 dark:bg-slate-800/30',
  'bg-slate-800': 'bg-slate-200 dark:bg-slate-800',
  'bg-slate-700': 'bg-slate-300 dark:bg-slate-700',
  'divide-slate-800': 'divide-slate-200 dark:divide-slate-800',
  'border-slate-800/60': 'border-slate-200 dark:border-slate-800/60',
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-700': 'border-slate-300 dark:border-slate-700',
  'hover:bg-slate-800/60': 'hover:bg-slate-200/70 dark:hover:bg-slate-800/60',
  'hover:bg-slate-800': 'hover:bg-slate-200 dark:hover:bg-slate-800',
  'hover:bg-slate-700': 'hover:bg-slate-300 dark:hover:bg-slate-700',
  'focus:bg-slate-800/60': 'focus:bg-slate-200 dark:focus:bg-slate-800/60',
  'disabled:hover:text-slate-300': 'disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300',
  'hover:text-white': 'hover:text-slate-900 dark:hover:text-white',
  'text-white': 'text-slate-900 dark:text-white',
  'text-slate-100': 'text-slate-900 dark:text-slate-100',
  'text-slate-200': 'text-slate-800 dark:text-slate-200',
  'text-slate-300': 'text-slate-700 dark:text-slate-300',
  'text-slate-400': 'text-slate-600 dark:text-slate-400',
  'text-slate-600': 'text-slate-400 dark:text-slate-600',
  'text-sky-400': 'text-sky-600 dark:text-sky-400',
  'text-red-300': 'text-red-600 dark:text-red-300',
  'text-red-400': 'text-red-600 dark:text-red-400',
  'border-red-900/60': 'border-red-200 dark:border-red-900/60',
  'bg-red-950/40': 'bg-red-50 dark:bg-red-950/40',
  'hover:bg-red-950': 'hover:bg-red-100 dark:hover:bg-red-950',
  'hover:text-red-300': 'hover:text-red-600 dark:hover:text-red-300',
  'bg-red-950': 'bg-red-100 dark:bg-red-950',
  'text-emerald-400': 'text-emerald-600 dark:text-emerald-400',
}

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (/\.(tsx|ts)$/.test(e.name)) yield p
  }
}

let changed = 0
for (const file of walk('C:/utilities/utilities/src')) {
  const src = readFileSync(file, 'utf8')
  const out = src
    .split(/([\s"'`{}=()<>]+)/)
    .map((tok) => MAP[tok] ?? tok)
    .join('')
  if (out !== src) {
    writeFileSync(file, out)
    console.log('updated', file)
    changed++
  }
}
console.log(`done: ${changed} files`)
