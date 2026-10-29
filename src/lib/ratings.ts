import { getFirebaseApp } from './firebase'

export interface ToolRatingData {
  rating: number
  review: string
  updatedAt: string
}

export interface ToolAggregate {
  averageScore: number
  ratingCount: number
}

const COLLECTION = 'tool_ratings'

const KEY_PREFIX = 'utility-hub.rating.'

const EMPTY: ToolRatingData = { rating: 0, review: '', updatedAt: '' }

export function loadRating(toolId: string): ToolRatingData {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${toolId}`)
    if (raw === null) return EMPTY
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return EMPTY
    const data = parsed as Partial<ToolRatingData>
    return {
      rating: typeof data.rating === 'number' && data.rating >= 1 && data.rating <= 5 ? data.rating : 0,
      review: typeof data.review === 'string' ? data.review : '',
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
    }
  } catch {
    return EMPTY
  }
}

export function saveRating(toolId: string, rating: number, review: string): ToolRatingData {
  const data: ToolRatingData = {
    rating,
    review,
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(`${KEY_PREFIX}${toolId}`, JSON.stringify(data))
  } catch {
    // storage unavailable — rating lives for this session only
  }
  return data
}

function toAggregate(data: Record<string, unknown>): ToolAggregate | null {
  const count = typeof data.ratingCount === 'number' ? data.ratingCount : 0
  const sum = typeof data.ratingSum === 'number' ? data.ratingSum : 0
  return count > 0 ? { averageScore: sum / count, ratingCount: count } : null
}

export async function fetchToolAggregate(toolId: string): Promise<ToolAggregate | null> {
  try {
    const { getFirestore, doc, getDoc } = await import('@firebase/firestore')
    const snap = await getDoc(doc(getFirestore(await getFirebaseApp()), COLLECTION, toolId))
    return snap.exists() ? toAggregate(snap.data()) : null
  } catch {
    return null
  }
}

export async function fetchAllToolAggregates(): Promise<Map<string, ToolAggregate>> {
  const map = new Map<string, ToolAggregate>()
  try {
    const { getFirestore, collection, getDocs } = await import('@firebase/firestore')
    const snap = await getDocs(collection(getFirestore(await getFirebaseApp()), COLLECTION))
    snap.forEach((d) => {
      const agg = toAggregate(d.data())
      if (agg) map.set(d.id, agg)
    })
  } catch {
    // offline or rules denied — callers fall back to localStorage
  }
  return map
}

export async function submitToolRating(
  toolId: string,
  rating: number,
  previous: number,
): Promise<void> {
  try {
    const { getFirestore, doc, setDoc, increment, serverTimestamp } = await import(
      '@firebase/firestore'
    )
    await setDoc(
      doc(getFirestore(await getFirebaseApp()), COLLECTION, toolId),
      {
        ratingSum: increment(rating - previous),
        ...(previous < 1 ? { ratingCount: increment(1) } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch {
    // best-effort — local copy is already saved, cloud catch-up is opportunistic
  }
}

export function buildToolSchema(
  toolName: string,
  url: string,
  ratingValue: number,
  ratingCount: number,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: toolName,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }
  if (ratingCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      ratingCount,
      bestRating: '5',
      worstRating: '1',
    }
  }
  return schema
}
