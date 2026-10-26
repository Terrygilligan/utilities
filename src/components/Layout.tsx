import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import InstallButton from './InstallButton'
import {
  Coffee,
  FileSpreadsheet,
  FileText,
  KeyRound,
  LayoutGrid,
  Menu,
  Mic,
  NotebookPen,
  QrCode,
  Wrench,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'All Tools', icon: LayoutGrid, end: true },
  { to: '/pdf', label: 'PDF Tools', icon: FileText, end: false },
  { to: '/qr-scanner', label: 'QR Scanner', icon: QrCode, end: false },
  { to: '/excel', label: 'Excel & CSV', icon: FileSpreadsheet, end: false },
  { to: '/notebook', label: 'Notebook', icon: NotebookPen, end: false },
  { to: '/voice', label: 'Voice Tools', icon: Mic, end: false },
  { to: '/passwords', label: 'Passwords', icon: KeyRound, end: false },
]

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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
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
          {label}
        </NavLink>
      ))}
    </>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
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
        <nav className="space-y-1 border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:hidden">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
        </nav>
      )}

      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 px-4 py-6 md:flex">
          <Brand />
          <nav className="mt-8 flex flex-col gap-1">
            <NavLinks />
          </nav>
          <div className="mt-auto flex items-center gap-2">
            <ThemeToggle />
            <InstallButton />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Installable PWA — works offline
          </p>
        </aside>

        <div className="min-w-0 flex-1">
          <main className="px-4 py-8 sm:px-8">
            <Outlet />
          </main>
          <footer className="border-t border-slate-200 px-4 pb-8 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 sm:px-8">
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/15 px-3 py-2 font-medium text-amber-700 transition hover:bg-amber-400/25 dark:text-amber-400"
            >
              <Coffee size={14} />
              Buy me a coffee
            </a>
            <InstallButton />
            <p className="mt-3">
              100% Client-Side &amp; Private · Zero Server Tracking · TOG
              Utilities
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
