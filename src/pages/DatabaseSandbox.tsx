import { useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  Database,
  Download,
  Loader2,
  Play,
  RefreshCw,
  Table2,
  Trash2,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import initSqlJs from 'sql.js'
import type { Database as SqlDatabase, QueryExecResult, SqlJsStatic } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { saveBlob } from '../lib/download'
import { t } from '../utils/i18n'

const DB_KEY = 'utility-hub.sandboxDb'
const PERSIST_LIMIT = 2 * 1024 * 1024
const MAX_ROWS = 500

const SAMPLE_SCHEMA = `CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id),
  amount REAL NOT NULL,
  ordered_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO customers (name, email) VALUES
  ('Alice Smith', 'alice@example.com'),
  ('Bob Jones', 'bob@example.com'),
  ('Chen Wei', 'chen@example.com');
INSERT INTO orders (customer_id, amount) VALUES
  (1, 49.99), (1, 15.50), (2, 120.00), (3, 9.95);`

const DEFAULT_QUERY = `SELECT c.name AS customer,
       COUNT(o.id) AS orders,
       COALESCE(SUM(o.amount), 0) AS total_spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id
ORDER BY total_spent DESC;`

const toBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

interface TableInfo {
  name: string
  columns: string[]
}

export default function DatabaseSandbox() {
  const sqlRef = useRef<SqlJsStatic | null>(null)
  const dbRef = useRef<SqlDatabase | null>(null)
  const persistTimer = useRef<number>(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [results, setResults] = useState<QueryExecResult[] | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [schema, setSchema] = useState<TableInfo[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tooBig, setTooBig] = useState(false)

  const refreshSchema = () => {
    const db = dbRef.current
    if (!db) return
    try {
      const res = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      const names = res.length ? res[0].values.map((r) => String(r[0])) : []
      setSchema(
        names.map((name) => {
          const info = db.exec(`PRAGMA table_info("${name.replace(/"/g, '""')}")`)
          return {
            name,
            columns: info.length ? info[0].values.map((c) => `${String(c[1])} ${String(c[2])}`) : [],
          }
        }),
      )
    } catch {
      setSchema([])
    }
  }

  const persistNow = () => {
    const db = dbRef.current
    if (!db) return
    try {
      const bytes = db.export()
      if (bytes.length > PERSIST_LIMIT) {
        setTooBig(true)
        return
      }
      localStorage.setItem(DB_KEY, toBase64(bytes))
      setTooBig(false)
    } catch {
      // quota / serialization failure — keep working in-memory
    }
  }

  const schedulePersist = () => {
    window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(persistNow, 500)
  }

  useEffect(() => {
    let cancelled = false
    initSqlJs({ locateFile: () => wasmUrl })
      .then((SQL) => {
        if (cancelled) return
        sqlRef.current = SQL
        let db: SqlDatabase | null = null
        const saved = localStorage.getItem(DB_KEY)
        if (saved) {
          try {
            db = new SQL.Database(fromBase64(saved))
          } catch {
            db = null
          }
        }
        if (!db) {
          db = new SQL.Database()
          db.run(SAMPLE_SCHEMA)
        }
        dbRef.current = db
        refreshSchema()
        setReady(true)
      })
      .catch(() => setError(t('Failed to load the SQLite engine.')))
    return () => {
      cancelled = true
      window.clearTimeout(persistTimer.current)
      try {
        dbRef.current?.close()
      } catch {
        // already closed
      }
    }
  }, [])

  const run = () => {
    const db = dbRef.current
    if (!db || !query.trim()) return
    setError(null)
    const start = performance.now()
    try {
      const res = db.exec(query)
      setElapsed(performance.now() - start)
      setResults(res)
      refreshSchema()
      schedulePersist()
    } catch (err) {
      setResults(null)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const dropAll = () => {
    const db = dbRef.current
    if (!db) return
    const res = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    for (const row of res[0]?.values ?? []) {
      db.run(`DROP TABLE IF EXISTS "${String(row[0]).replace(/"/g, '""')}"`)
    }
  }

  const resetSample = () => {
    const db = dbRef.current
    if (!db) return
    dropAll()
    db.run(SAMPLE_SCHEMA)
    setQuery(DEFAULT_QUERY)
    setResults(null)
    setError(null)
    refreshSchema()
    schedulePersist()
  }

  const clearDb = () => {
    if (!window.confirm(t('Drop every table and clear the saved database?'))) return
    dropAll()
    localStorage.removeItem(DB_KEY)
    setResults(null)
    setError(null)
    refreshSchema()
  }

  const exportDb = () => {
    const bytes = dbRef.current?.export()
    if (!bytes) return
    saveBlob(
      new Blob([bytes as BlobPart], { type: 'application/x-sqlite3' }),
      `sqlite-sandbox-${new Date().toISOString().slice(0, 10)}.sqlite`,
    )
  }

  const importDb = async (file: File) => {
    const SQL = sqlRef.current
    if (!SQL) return
    try {
      const next = new SQL.Database(new Uint8Array(await file.arrayBuffer()))
      dbRef.current?.close()
      dbRef.current = next
      setResults(null)
      setError(null)
      refreshSchema()
      schedulePersist()
    } catch {
      setError(t('Could not open that file as a SQLite database.'))
    }
  }

  const chip =
    'inline-flex items-center gap-1.5 rounded-lg bg-slate-500/15 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-500/25 dark:text-slate-300'

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Database size={22} className="text-sky-600 dark:text-sky-400" />
        {t('SQL Sandbox')}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('A full SQLite engine running in your browser via WebAssembly — write queries, inspect the schema, import and export .sqlite files. Nothing leaves your device.')}
      </p>

      {!ready && !error && (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 size={15} className="animate-spin" /> {t('Loading the SQLite engine…')}
        </p>
      )}

      {ready && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={run}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-500"
            >
              <Play size={13} /> {t('Run query')} <span className="hidden opacity-70 sm:inline">(Ctrl+Enter)</span>
            </button>
            <button type="button" onClick={resetSample} className={chip} title={t('Reset to sample data')}>
              <RefreshCw size={14} /> {t('Sample data')}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={chip}>
              <Upload size={14} /> {t('Import .sqlite')}
            </button>
            <button type="button" onClick={exportDb} className={chip}>
              <Download size={14} /> {t('Export .sqlite')}
            </button>
            <button
              type="button"
              onClick={clearDb}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 size={14} /> {t('db.clear')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".sqlite,.db,.sqlite3"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void importDb(f)
              }}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Table2 size={13} /> {t('Tables ({count})', { count: schema.length })}
              </h2>
              {schema.length === 0 ? (
                <p className="mt-3 text-xs italic text-slate-400">{t('No tables — run some DDL.')}</p>
              ) : (
                <ul className="mt-3 space-y-1">
                  {schema.map((tbl) => (
                    <li key={tbl.name}>
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === tbl.name ? null : tbl.name)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 font-mono text-xs text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {tbl.name}
                        <ChevronRight
                          size={12}
                          className={`transition-transform ${expanded === tbl.name ? 'rotate-90' : ''}`}
                        />
                      </button>
                      {expanded === tbl.name && (
                        <div className="mb-1 ml-2 border-l border-slate-200 pl-3 dark:border-slate-700">
                          {tbl.columns.map((col) => (
                            <p key={col} className="py-0.5 font-mono text-[11px] text-slate-500">
                              {col}
                            </p>
                          ))}
                          <button
                            type="button"
                            onClick={() => setQuery(`SELECT * FROM "${tbl.name}" LIMIT 100;`)}
                            className="py-0.5 text-[11px] font-medium text-sky-600 hover:underline dark:text-sky-400"
                          >
                            SELECT *
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4 lg:col-span-3">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run()
                }}
                rows={7}
                spellCheck={false}
                placeholder={t('Write SQL here — Ctrl+Enter to run')}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200"
              />

              {error && (
                <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-600 dark:text-red-400">
                  <TriangleAlert size={14} className="mt-0.5 shrink-0" /> {error}
                </p>
              )}

              {tooBig && !error && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                  {t('Database exceeds 2 MB — it keeps working this session but won’t be saved across reloads. Export a .sqlite file to keep it.')}
                </p>
              )}

              {results !== null && !error && (
                <div className="space-y-4">
                  {results.length === 0 && (
                    <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                      {t('Statement executed successfully — no rows returned. ({ms} ms)', { ms: elapsed.toFixed(1) })}
                    </p>
                  )}
                  {results.map((res, i) => (
                    <div
                      key={i}
                      className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    >
                      <p className="border-b border-slate-200 px-4 py-2 text-[11px] font-medium text-slate-500 dark:border-slate-800">
                        {res.values.length} {res.values.length === 1 ? t('row') : t('rows')} ·{' '}
                        {elapsed.toFixed(1)} ms
                      </p>
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            {res.columns.map((col, ci) => (
                              <th key={ci} className="px-3 py-2 font-semibold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {res.values.slice(0, MAX_ROWS).map((row, ri) => (
                            <tr
                              key={ri}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                            >
                              {row.map((val, ci) => (
                                <td key={ci} className="px-3 py-1.5 text-slate-700 dark:text-slate-300">
                                  {val === null ? (
                                    <span className="italic text-slate-400">NULL</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {res.values.length > MAX_ROWS && (
                        <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800">
                          {t('Showing first {shown} of {total} rows', { shown: MAX_ROWS, total: res.values.length })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
