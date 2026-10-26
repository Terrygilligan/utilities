import { useMemo, useState } from 'react'
import { GitCompareArrows } from 'lucide-react'

type Row = { type: 'same' | 'del' | 'add'; left?: string; right?: string }

function diff(a: string[], b: string[]): Row[] {
  const n = a.length, m = b.length
  // LCS table (bounded to keep UI responsive)
  if (n * m > 4_000_000) {
    // fallback: naive line pairing for huge inputs
    const rows: Row[] = []
    const len = Math.max(n, m)
    for (let i = 0; i < len; i++)
      rows.push(
        a[i] === b[i]
          ? { type: 'same', left: a[i], right: b[i] }
          : { type: 'del', left: a[i] } as Row,
      )
    for (let i = 0; i < len; i++) if (a[i] !== b[i] && b[i] !== undefined) rows.splice(i + Math.floor(rows.length / 2), 0, { type: 'add', right: b[i] })
    return rows
  }
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const rows: Row[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { rows.push({ type: 'same', left: a[i], right: b[j] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push({ type: 'del', left: a[i] }); i++ }
    else { rows.push({ type: 'add', right: b[j] }); j++ }
  }
  while (i < n) rows.push({ type: 'del', left: a[i++] })
  while (j < m) rows.push({ type: 'add', right: b[j++] })
  return rows
}

export default function DiffChecker() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const rows = useMemo(
    () => (left || right ? diff(left.split('\n'), right.split('\n')) : []),
    [left, right],
  )
  const changed = rows.filter((r) => r.type !== 'same').length

  const area = 'w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-950/60'
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Text &amp; Code Diff</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Paste two versions of a file — lines are compared locally with a real LCS diff. Nothing is sent anywhere.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500">Original</label>
          <textarea value={left} onChange={(e) => setLeft(e.target.value)} rows={10} spellCheck={false} className={`${area} mt-1`} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Modified</label>
          <textarea value={right} onChange={(e) => setRight(e.target.value)} rows={10} spellCheck={false} className={`${area} mt-1`} />
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <GitCompareArrows size={14} />
            {changed === 0 ? 'Identical — no differences' : `${changed} changed line${changed === 1 ? '' : 's'}`}
            <span className="ml-auto flex gap-3">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-400/60" /> removed</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/60" /> added</span>
            </span>
          </div>
          <div className="max-h-[28rem] overflow-auto bg-white font-mono text-xs leading-6 dark:bg-slate-900">
            {rows.map((r, i) => (
              <div key={i} className={`grid grid-cols-2 ${r.type === 'del' ? 'bg-red-500/10' : r.type === 'add' ? 'bg-emerald-500/10' : ''}`}>
                <div className={`truncate border-r border-slate-200 px-3 whitespace-pre dark:border-slate-800 ${r.type === 'del' ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'}`}>
                  {r.left ?? ''}
                </div>
                <div className={`truncate px-3 whitespace-pre ${r.type === 'add' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                  {r.right ?? ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
