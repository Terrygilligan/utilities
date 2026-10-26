import { Moon, Sun, SunMoon } from 'lucide-react'
import { useTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'

const ORDER: Theme[] = ['light', 'dark', 'system']
const META: Record<Theme, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: 'Light' },
  dark: { icon: Moon, label: 'Dark' },
  system: { icon: SunMoon, label: 'System' },
}

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  const Icon = META[theme].icon
  const label = `Theme: ${META[theme].label} — switch to ${META[next].label}`

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={label}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 dark:text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <Icon size={18} />
    </button>
  )
}
