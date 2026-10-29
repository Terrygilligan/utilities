import { t } from '../../utils/i18n'

export interface Note {
  id: string
  title: string
  content: string
  updatedAt: number
}

const STORAGE_KEY = 'utility-hub.notes.v1'

function readAll(): Record<string, Note> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, Note>
  } catch {
    return {}
  }
}

function writeAll(notes: Record<string, Note>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function loadNotes(): Note[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function persistNote(note: Note) {
  const all = readAll()
  all[note.id] = note
  writeAll(all)
}

export function removeNote(id: string) {
  const all = readAll()
  delete all[id]
  writeAll(all)
}

export function createNote(): Note {
  const note: Note = {
    id: `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: t('Untitled note'),
    content: t('# Untitled\n\nStart writing in **Markdown**…'),
    updatedAt: Date.now(),
  }
  persistNote(note)
  return note
}
