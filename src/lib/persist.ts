import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export type SaveState = 'saving' | 'saved'

function load<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return initial
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof initial === 'object' &&
      initial !== null &&
      !Array.isArray(initial) &&
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return { ...initial, ...(parsed as T) }
    }
    return parsed as T
  } catch {
    return initial
  }
}

export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, SaveState] {
  const [value, setValue] = useState<T>(() => load(key, initial))
  const [saveState, setSaveState] = useState<SaveState>('saved')

  useEffect(() => {
    setSaveState('saving')
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable — badge still cycles, data just won't persist
    }
    const timer = setTimeout(() => setSaveState('saved'), 800)
    return () => clearTimeout(timer)
  }, [key, value])

  return [value, setValue, saveState]
}
