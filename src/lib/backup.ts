const PREFIX = 'utility-hub.'

export function dataKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(PREFIX)) keys.push(key)
  }
  return keys
}

export function snapshot(): Record<string, string> {
  const data: Record<string, string> = {}
  for (const key of dataKeys()) {
    data[key] = localStorage.getItem(key) ?? ''
  }
  return data
}

export function restore(data: Record<string, string>) {
  for (const key of dataKeys()) localStorage.removeItem(key)
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, value)
  }
}

export function clearAllData() {
  for (const key of dataKeys()) localStorage.removeItem(key)
}

export async function storagePersisted(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted()) ?? false
  } catch {
    return false
  }
}

export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist()) ?? false
  } catch {
    return false
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const est = await navigator.storage?.estimate()
    return est && typeof est.usage === 'number' && typeof est.quota === 'number'
      ? { usage: est.usage, quota: est.quota }
      : null
  } catch {
    return null
  }
}
