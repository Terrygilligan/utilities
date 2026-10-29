import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  Check,
  FileDown,
  FilePlus2,
  List,
  Loader2,
  NotebookPen,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { saveBlob, baseName } from '../lib/download'
import ShareButton from '../components/ShareButton'
import { createNote, loadNotes, persistNote, removeNote } from './notebook/store'
import type { Note } from './notebook/store'
import { markdownToPdfBlob } from './notebook/exportPdf'
import { t } from '../utils/i18n'

const byRecent = (a: Note, b: Note) => b.updatedAt - a.updatedAt

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NoteList({
  notes,
  activeId,
  onSelect,
  onDelete,
}: {
  notes: Note[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <ul className="space-y-1">
      {notes.map((note) => (
        <li key={note.id} className="group relative">
          <button
            type="button"
            onClick={() => onSelect(note.id)}
            className={`w-full rounded-lg px-3 py-2 pr-9 text-left transition ${
              note.id === activeId
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="block truncate text-sm font-medium">{note.title}</span>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              {formatTime(note.updatedAt)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            aria-label={t('Delete {title}', { title: note.title })}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-300 md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function Notebook() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [activeId, setActiveId] = useState<string | null>(
    () => loadNotes()[0]?.id ?? null,
  )
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [listOpen, setListOpen] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveTimer = useRef<number | null>(null)
  const pendingRef = useRef<Note | null>(null)

  const active = notes.find((note) => note.id === activeId) ?? null

  const flushSave = useCallback(() => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    if (pendingRef.current) {
      try {
        persistNote(pendingRef.current)
        setSavedAt(Date.now())
      } catch {
        setError(t('Could not save — browser storage is full or unavailable.'))
      }
      pendingRef.current = null
    }
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', flushSave)
    return () => {
      window.removeEventListener('beforeunload', flushSave)
      flushSave()
    }
  }, [flushSave])

  const patchActive = useCallback(
    (patch: Partial<Pick<Note, 'title' | 'content'>>) => {
      setNotes((current) =>
        current
          .map((note) => {
            if (note.id !== activeId) return note
            const updated = { ...note, ...patch, updatedAt: Date.now() }
            pendingRef.current = updated
            return updated
          })
          .sort(byRecent),
      )
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(flushSave, 400)
    },
    [activeId, flushSave],
  )

  const handleCreate = useCallback(() => {
    flushSave()
    const note = createNote()
    setNotes((current) => [note, ...current])
    setActiveId(note.id)
    setMobileView('edit')
    setListOpen(false)
  }, [flushSave])

  const handleSelect = useCallback(
    (id: string) => {
      if (id === activeId) return
      flushSave()
      setActiveId(id)
      setListOpen(false)
    },
    [activeId, flushSave],
  )

  const handleDelete = useCallback(
    (id: string) => {
      const target = notes.find((note) => note.id === id)
      if (!target || !window.confirm(t('Delete “{title}”? This cannot be undone.', { title: target.title })))
        return
      removeNote(id)
      setNotes((current) => {
        const remaining = current.filter((note) => note.id !== id)
        if (id === activeId) setActiveId(remaining[0]?.id ?? null)
        return remaining
      })
    },
    [notes, activeId],
  )

  const previewHtml = useMemo(
    () =>
      DOMPurify.sanitize(
        marked.parse(active?.content ?? '', { async: false }) as string,
      ),
    [active?.content],
  )

  const exportMarkdown = useCallback(() => {
    if (!active) return
    saveBlob(
      new Blob([active.content], { type: 'text/markdown;charset=utf-8' }),
      `${baseName(active.title)}.md`,
    )
  }, [active])

  const exportHtml = useCallback(() => {
    if (!active) return
    const safeTitle = active.title.replace(/[<>]/g, '')
    const documentHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<style>
  body { font-family: system-ui, sans-serif; line-height: 1.65; color: #1f2937; }
  main { max-width: 44rem; margin: 2.5rem auto; padding: 0 1rem; }
  pre, code { background: #f1f5f9; border-radius: 0.35rem; }
  pre { padding: 1rem; overflow-x: auto; }
  code { padding: 0.15em 0.4em; }
  pre code { padding: 0; }
  blockquote { border-left: 3px solid #cbd5e1; margin-left: 0; padding-left: 1rem; color: #64748b; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #cbd5e1; padding: 0.35rem 0.7rem; }
  img { max-width: 100%; }
</style>
</head>
<body><main>${previewHtml}</main></body>
</html>`
    saveBlob(
      new Blob([documentHtml], { type: 'text/html;charset=utf-8' }),
      `${baseName(active.title)}.html`,
    )
  }, [active, previewHtml])

  const exportPdf = useCallback(async () => {
    if (!active) return
    setExporting(true)
    try {
      const blob = await markdownToPdfBlob(previewHtml, active.title)
      saveBlob(blob, `${baseName(active.title)}.pdf`)
    } catch {
      setError(t('Could not generate the PDF.'))
    } finally {
      setExporting(false)
    }
  }, [active, previewHtml])

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Markdown Notebook')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Distraction-free notes with live preview. Saved automatically to this device — no account, no cloud.')}
      </p>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <TriangleAlert size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-5">
        <aside className="hidden w-60 shrink-0 md:block">
          <button
            type="button"
            onClick={handleCreate}
            className="mb-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-500/15 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25"
          >
            <FilePlus2 size={16} />
            {t('New note')}
          </button>
          <NoteList
            notes={notes}
            activeId={activeId}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        </aside>

        <div className="min-w-0 flex-1">
          {active ? (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setListOpen(true)}
                  aria-label={t('Open notes list')}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 md:hidden"
                >
                  <List size={18} />
                </button>
                <input
                  value={active.title}
                  onChange={(event) => patchActive({ title: event.target.value })}
                  onBlur={flushSave}
                  aria-label={t('Note title')}
                  className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:bg-slate-200 dark:focus:bg-slate-800/60"
                />
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={exportMarkdown}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  >
                    <FileDown size={15} />
                    .md
                  </button>
                  <button
                    type="button"
                    onClick={exportHtml}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  >
                    <FileDown size={15} />
                    .html
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportPdf()}
                    disabled={exporting}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 text-xs font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:opacity-40"
                  >
                    {exporting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <FileDown size={15} />
                    )}
                    .pdf
                  </button>
                  <ShareButton
                    payload={() =>
                      active && {
                        kind: 'file',
                        file: new File([active.content], `${baseName(active.title)}.md`, {
                          type: 'text/markdown',
                        }),
                      }
                    }
                  />
                </div>
              </div>

              <div className="mt-3 flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 md:hidden">
                {(['edit', 'preview'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setMobileView(view)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                      mobileView === view
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t(view)}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <textarea
                  value={active.content}
                  onChange={(event) => patchActive({ content: event.target.value })}
                  placeholder={t('Write markdown…')}
                  spellCheck
                  className={`min-h-[55vh] w-full resize-y rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 outline-none transition focus:border-sky-500/60 ${
                    mobileView === 'preview' ? 'hidden md:block' : ''
                  }`}
                />
                <div
                  className={`md-preview min-h-[55vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-4 text-sm ${
                    mobileView === 'edit' ? 'hidden md:block' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                {savedAt ? (
                  <>
                    <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                    {t('Auto-saved {time}', { time: formatTime(savedAt) })}
                  </>
                ) : (
                  t('Saves automatically as you type')
                )}
                <span className="mx-1">·</span>
                {t('{count} chars', { count: active.content.length })}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 px-6 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
                <NotebookPen size={26} />
              </span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('No notes yet')}</p>
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25"
              >
                <FilePlus2 size={16} />
                {t('Create your first note')}
              </button>
            </div>
          )}
        </div>
      </div>

      {listOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70"
            onClick={() => setListOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
            <button
              type="button"
              onClick={handleCreate}
              className="mb-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-500/15 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25"
            >
              <FilePlus2 size={16} />
              {t('New note')}
            </button>
            <NoteList
              notes={notes}
              activeId={activeId}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          </aside>
        </div>
      )}
    </div>
  )
}
