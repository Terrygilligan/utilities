export const APP_VERSION = '1.3.0'

const VERSION_KEY = 'utility-hub.last-seen-version'
const TOURS_KEY = 'utility-hub.show-update-tours'

export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(VERSION_KEY)
  } catch {
    return null
  }
}

export function setLastSeenVersion(version: string = APP_VERSION) {
  try {
    localStorage.setItem(VERSION_KEY, version)
  } catch {
    // storage unavailable — banner simply reappears next visit
  }
}

export function toursEnabled(): boolean {
  try {
    return localStorage.getItem(TOURS_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setToursEnabled(enabled: boolean) {
  try {
    localStorage.setItem(TOURS_KEY, String(enabled))
  } catch {
    // storage unavailable — preference won't persist
  }
}

export function isNewerVersion(current: string, lastSeen: string | null): boolean {
  if (!lastSeen) return true
  const a = current.split('.').map((n) => parseInt(n, 10) || 0)
  const b = lastSeen.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}
