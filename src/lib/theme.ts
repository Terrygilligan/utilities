import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const KEY = 'utility-hub.theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

const resolve = (theme: Theme) =>
  theme === 'system' ? (media().matches ? 'dark' : 'light') : theme

function apply(theme: Theme) {
  const resolved = resolve(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.style.colorScheme = resolved
}

export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored === 'light' || stored === 'dark' ? stored : 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    apply(theme)
    if (theme === 'system') {
      const mq = media()
      const onChange = () => apply('system')
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
  }, [theme])

  const set = useCallback((next: Theme) => {
    setTheme(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // storage unavailable — theme still applies for this session
    }
  }, [])

  return [theme, set]
}
