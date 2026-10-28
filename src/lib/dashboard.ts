const FAV_KEY = 'utility-hub.favorites'
const ORDER_KEY = 'utility-hub.tool-order'

const readList = (key: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

const writeList = (key: string, value: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable — preference just won't persist
  }
}

export const readFavorites = (): string[] => readList(FAV_KEY)
export const writeFavorites = (ids: string[]) => writeList(FAV_KEY, ids)
export const readOrder = (): string[] => readList(ORDER_KEY)
export const writeOrder = (ids: string[]) => writeList(ORDER_KEY, ids)

export function resolveOrder(saved: string[], defaults: string[]): string[] {
  const known = new Set(defaults)
  const order = saved.filter((id, i) => known.has(id) && saved.indexOf(id) === i)
  for (const id of defaults) if (!order.includes(id)) order.push(id)
  return order
}
