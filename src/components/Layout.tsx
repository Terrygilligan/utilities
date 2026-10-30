import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import InstallButton from './InstallButton'
import BackupPanel from './BackupPanel'
import BugReport from './BugReport'
import FeatureSuggest from './FeatureSuggest'
import SettingsMenu from './SettingsMenu'
import ToolRating from './ToolRating'
import CurrencySelect from './CurrencySelect'
import LangSelect from './LangSelect'
import { TOOLS } from '../lib/tools'
import { t } from '../utils/i18n'
import {
  ArrowRightLeft,
  Barcode,
  BatteryCharging,
  Braces,
  BrickWall,
  Calculator,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  CloudRain,
  Coffee,
  Code2,
  Database,
  ExternalLink,
  FileCheck2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Gamepad2,
  GitCompareArrows,
  Hash,
  ImageDown,
  KeyRound,
  LayoutGrid,
  Menu,
  Mic,
  MonitorPlay,
  NotebookPen,
  Palette,
  QrCode,
  Receipt,
  RefreshCw,
  ScanBarcode,
  ScanText,
  ScrollText,
  ShieldCheck,
  Stamp,
  Timer,
  Type,
  Waves,
  Wrench,
  X,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const allToolsItem: NavItem = { to: '/', label: 'All Tools', icon: LayoutGrid, end: true }

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Documents & Data',
    items: [
      { to: '/pdf', label: 'PDF Tools', icon: FileText },
      { to: '/excel', label: 'Excel & CSV', icon: FileSpreadsheet },
      { to: '/notebook', label: 'Notebook', icon: NotebookPen },
      { to: '/photo-text', label: 'Photo → Text', icon: ScanText },
      { to: '/text-tools', label: 'Text Tools', icon: Type },
      { to: '/sync', label: 'Sync Hub', icon: RefreshCw },
    ],
  },
  {
    label: 'Developer & Code',
    items: [
      { to: '/playground', label: 'Regex & JSON', icon: Braces },
      { to: '/checksum', label: 'Checksums', icon: FileCheck2 },
      { to: '/svg', label: 'SVG Optimizer', icon: FileCode2 },
      { to: '/diff', label: 'Diff Checker', icon: GitCompareArrows },
      { to: '/codec', label: 'Base64 & URL', icon: Code2 },
      { to: '/uuid', label: 'UUID & Random', icon: Hash },
      { to: '/cron', label: 'Cron Explainer', icon: CalendarClock },
      { to: '/sql', label: 'SQL Sandbox', icon: Database },
    ],
  },
  {
    label: 'Media & Design',
    items: [
      { to: '/image-optimizer', label: 'Image Optimizer', icon: ImageDown },
      { to: '/colors', label: 'Color Tools', icon: Palette },
      { to: '/media', label: 'Media Tools', icon: Clapperboard },
      { to: '/watermark', label: 'Watermark', icon: Stamp },
      { to: '/screen-recorder', label: 'Screen Recorder', icon: MonitorPlay },
    ],
  },
  {
    label: 'Math, Time & Conversion',
    items: [
      { to: '/convert', label: 'Unit Converter', icon: ArrowRightLeft },
      { to: '/calc-tools', label: 'Calc & Time', icon: Calculator },
      { to: '/timer', label: 'Timer & Pomodoro', icon: Timer },
      { to: '/dates', label: 'Date & Age', icon: CalendarDays },
    ],
  },
  {
    label: 'Scanners & Codes',
    items: [
      { to: '/qr-scanner', label: 'QR Scanner', icon: QrCode },
      { to: '/qr-generator', label: 'QR Generator', icon: QrCode },
      { to: '/barcode', label: 'Barcode', icon: Barcode },
      { to: '/barcode-scanner', label: 'Barcode Scanner', icon: ScanBarcode },
    ],
  },
  {
    label: 'Security & Finance',
    items: [
      { to: '/passwords', label: 'Passwords', icon: KeyRound },
      { to: '/totp', label: 'Authenticator', icon: ShieldCheck },
      { to: '/expenses', label: 'Expenses', icon: Receipt },
      { to: '/invoice', label: 'Invoice Maker', icon: ScrollText },
    ],
  },
  {
    label: 'Homestead & Workshop',
    items: [
      { to: '/solar', label: 'Solar Autonomy', icon: BatteryCharging },
      { to: '/rainwater', label: 'Rainwater', icon: CloudRain },
      { to: '/mix', label: 'Mix Estimator', icon: BrickWall },
      { to: '/swale', label: 'Swale & Slope', icon: Waves },
    ],
  },
  {
    label: 'Audio & Misc',
    items: [{ to: '/voice', label: 'Voice Tools', icon: Mic }],
  },
]

const COLLAPSE_KEY = 'utility-hub.nav.collapsed'

function readCollapsed(): Record<string, boolean> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? '{}')
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
        <Wrench size={18} />
      </span>
      <span className="text-base font-semibold tracking-tight">Utility Hub</span>
    </NavLink>
  )
}

function NavItemLink({ to, label, icon: Icon, end, onNavigate }: NavItem & { onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      {t(label)}
    </NavLink>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(readCollapsed)

  const persist = (next: Record<string, boolean>) => {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next))
    } catch {
      // storage unavailable — collapse state just won't persist
    }
  }

  useEffect(() => {
    const active = navGroups.find((g) => g.items.some((item) => item.to === pathname))
    if (!active) return
    setCollapsed((current) => {
      if (!current[active.label]) return current
      const next = { ...current, [active.label]: false }
      persist(next)
      return next
    })
  }, [pathname])

  const toggle = (label: string) =>
    setCollapsed((current) => {
      const next = { ...current, [label]: !current[label] }
      persist(next)
      return next
    })

  return (
    <>
      <NavItemLink {...allToolsItem} onNavigate={onNavigate} />
      {navGroups.map((group) => {
        const isCollapsed = !!collapsed[group.label]
        return (
          <div key={group.label} className="mt-3">
            <button
              type="button"
              onClick={() => toggle(group.label)}
              className="flex w-full items-center justify-between px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {t(group.label)}
              <ChevronDown
                size={13}
                className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
              />
            </button>
            {!isCollapsed &&
              group.items.map((item) => (
                <NavItemLink key={item.to} {...item} onNavigate={onNavigate} />
              ))}
          </div>
        )
      })}
      <a
        href="https://games-hub-online.web.app/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
      >
        <Gamepad2 size={18} />
        {t('Games Hub')}
        <ExternalLink size={12} className="ml-auto text-slate-400" />
      </a>
    </>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const ratedTool = TOOLS.find((tool) => tool.to === pathname)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-4 py-3 backdrop-blur md:hidden print:hidden">
        <Brand />
        <CurrencySelect />
        <LangSelect />
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
          className="rounded-lg p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {menuOpen && (
        <nav className="max-h-[75vh] space-y-1 overflow-y-auto border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:hidden print:hidden">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
        </nav>
      )}

      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 px-4 py-6 md:flex print:hidden">
          <Brand />
          <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-1">
            <NavLinks />
          </nav>
          <div className="mt-auto flex flex-wrap items-center gap-2">
            <CurrencySelect />
            <LangSelect />
            <ThemeToggle />
            <InstallButton />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {t('Installable PWA — works offline')}
          </p>
        </aside>

        <div className="min-w-0 flex-1">
          <main className="px-4 py-8 sm:px-8">
            {ratedTool && (
              <ToolRating
                key={pathname}
                toolId={ratedTool.id.slice(1)}
                toolName={ratedTool.title}
              />
            )}
            <Outlet />
          </main>
          <footer className="border-t border-slate-200 px-4 pb-8 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 sm:px-8 print:hidden">
            <a
              href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=terrythemeat%40hotmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/15 px-3 py-2 font-medium text-amber-700 transition hover:bg-amber-400/25 dark:text-amber-400"
            >
              <Coffee size={14} />
              {t('Buy me a coffee')}
            </a>
            <InstallButton />
            <BackupPanel />
            <p className="mt-3">
              {t('Your Files & Data Never Leave Your Device · Anonymous Usage Stats Only · TOG Utilities')}
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <BugReport />
              <FeatureSuggest />
              <a
                href="https://games-hub-online.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
              >
                <Gamepad2 size={12} />
                {t('Games Hub')}
              </a>
              <SettingsMenu />
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
