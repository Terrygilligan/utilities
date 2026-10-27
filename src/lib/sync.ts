import { restore, snapshot } from './backup'

const PREFIX = 'utility-hub.'
const TAG_GZIP = 'UHUBZ:'
const TAG_JSON = 'UHUBJ:'

export interface Snapshot {
  app: 'utility-hub'
  version: number
  exportedAt: string
  data: Record<string, string>
}

const b64encode = (bytes: Uint8Array) => {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

const b64decode = (s: string): Uint8Array => {
  const bin = atob(s.replaceAll('-', '+').replaceAll('_', '/'))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

const pipe = async (bytes: Uint8Array, ts: TransformStream) => {
  const stream = new Blob([bytes.slice() as BlobPart]).stream().pipeThrough(ts)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export function snapshotPayload(): Snapshot {
  return {
    app: 'utility-hub',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: snapshot(),
  }
}

const validate = (s: unknown): Snapshot => {
  const snap = s as Snapshot
  if (
    snap?.app !== 'utility-hub' ||
    !snap.data ||
    typeof snap.data !== 'object' ||
    Object.values(snap.data).some((v) => typeof v !== 'string')
  ) {
    throw new Error('Not a valid Utility Hub snapshot.')
  }
  return snap
}

export async function encodePayload(snap: Snapshot): Promise<string> {
  const json = JSON.stringify(snap)
  try {
    const zipped = await pipe(new TextEncoder().encode(json), new CompressionStream('deflate'))
    return TAG_GZIP + b64encode(zipped)
  } catch {
    return TAG_JSON + b64encode(new TextEncoder().encode(json))
  }
}

export async function decodePayload(payload: string): Promise<Snapshot> {
  const t = payload.trim()
  if (t.startsWith(TAG_GZIP)) {
    const zipped = b64decode(t.slice(TAG_GZIP.length))
    const json = await pipe(zipped, new DecompressionStream('deflate'))
    return validate(JSON.parse(new TextDecoder().decode(json)))
  }
  if (t.startsWith(TAG_JSON)) {
    return validate(JSON.parse(new TextDecoder().decode(b64decode(t.slice(TAG_JSON.length)))))
  }
  return validate(JSON.parse(t))
}

const recordKey = (el: unknown): string | null => {
  if (!el || typeof el !== 'object') return null
  const rec = el as Record<string, unknown>
  const id = rec.uuid ?? rec.id
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null
}

const ts = (el: Record<string, unknown>) => {
  const t = typeof el.updatedAt === 'string' ? Date.parse(el.updatedAt) : NaN
  return isNaN(t) ? 0 : t
}

const tryMergeList = (existing: string, incoming: string): string | null => {
  let a: unknown
  let b: unknown
  try {
    a = JSON.parse(existing)
    b = JSON.parse(incoming)
  } catch {
    return null
  }
  if (!Array.isArray(a) || !Array.isArray(b)) return null
  if (![...a, ...b].every((el) => recordKey(el) !== null)) return null
  const map = new Map<string, Record<string, unknown>>()
  for (const el of a) map.set(recordKey(el)!, el as Record<string, unknown>)
  for (const el of b as Record<string, unknown>[]) {
    const id = recordKey(el)!
    const cur = map.get(id)
    if (!cur || ts(el) >= ts(cur)) map.set(id, el)
  }
  return JSON.stringify([...map.values()])
}

export interface MergeResult {
  keys: number
  written: number
  unchanged: number
}

export function mergeData(incoming: Record<string, string>): MergeResult {
  const result: MergeResult = { keys: 0, written: 0, unchanged: 0 }
  for (const [key, raw] of Object.entries(incoming)) {
    if (!key.startsWith(PREFIX)) continue
    result.keys++
    const existing = localStorage.getItem(key)
    const next =
      existing === null
        ? raw
        : (tryMergeList(existing, raw) ?? (existing !== raw ? raw : existing))
    if (next === existing) {
      result.unchanged++
    } else {
      localStorage.setItem(key, next)
      result.written++
    }
  }
  return result
}

export function overwriteData(incoming: Record<string, string>): number {
  const entries = Object.entries(incoming).filter(([key]) => key.startsWith(PREFIX))
  restore(Object.fromEntries(entries))
  return entries.length
}
