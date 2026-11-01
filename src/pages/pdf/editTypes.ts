export interface PageEntry {
  src: number
  rot: 0 | 90 | 180 | 270
  deleted: boolean
}

export interface Pt {
  x: number
  y: number
}

export type Annotation =
  | { kind: 'stroke'; color: string; size: number; alpha: number; points: Pt[] }
  | { kind: 'text'; color: string; size: number; at: Pt; text: string }

export interface EditState {
  pages: PageEntry[]
  annotations: Record<number, Annotation[]>
  formValues: Record<string, string>
}

export type EditTool = 'select' | 'pen' | 'highlighter' | 'text'

export const emptyEditState = (numPages: number): EditState => ({
  pages: Array.from({ length: numPages }, (_, i) => ({
    src: i + 1,
    rot: 0 as const,
    deleted: false,
  })),
  annotations: {},
  formValues: {},
})

export const EDIT_COLORS = ['#1e293b', '#dc2626', '#2563eb', '#16a34a', '#eab308']

export const HIGHLIGHTER_ALPHA = 0.35

// Sizes are fractions of the displayed page width, so marks scale with the page.
export const TOOL_SIZES: Record<'pen' | 'highlighter' | 'text', number[]> = {
  pen: [0.003, 0.006, 0.012],
  highlighter: [0.02, 0.035, 0.055],
  text: [0.02, 0.032, 0.05],
}

export const isEditDirty = (edit: EditState): boolean =>
  edit.pages.some((page, i) => page.src !== i + 1 || page.rot !== 0 || page.deleted) ||
  Object.values(edit.annotations).some((list) => list.length > 0) ||
  Object.keys(edit.formValues).length > 0
