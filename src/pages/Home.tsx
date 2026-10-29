import { useState } from 'react'
import {
  ArrowRightLeft,
  ArrowUpDown,
  Barcode,
  BatteryCharging,
  BrickWall,
  CalendarClock,
  Braces,
  Calculator,
  Clapperboard,
  CloudRain,
  Code2,
  Database,
  FileCheck2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  Hash,
  ImageDown,
  KeyRound,
  Mic,
  MonitorPlay,
  NotebookPen,
  Palette,
  QrCode,
  Receipt,
  RefreshCw,
  ScanBarcode,
  ShieldCheck,
  Sparkles,
  Stamp,
  Star,
  Timer,
  Type,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import UpdateBanner from '../components/UpdateBanner'
import { readFavorites, readOrder, resolveOrder, writeFavorites, writeOrder } from '../lib/dashboard'
import { t } from '../utils/i18n'

interface Tool {
  id: string
  to: string
  title: string
  description: string
  icon: LucideIcon
}

const TOOLS: Tool[] = [
  {
    id: '/pdf',
    to: '/pdf',
    title: 'PDF Reader & Converter',
    description: 'Open, read, and convert PDF documents right on your device. Files never leave your machine.',
    icon: FileText,
  },
  {
    id: '/qr-scanner',
    to: '/qr-scanner',
    title: 'QR Code Scanner',
    description: 'Point your camera at a QR code to instantly read links, Wi-Fi credentials, and more.',
    icon: QrCode,
  },
  {
    id: '/excel',
    to: '/excel',
    title: 'Excel & CSV Converter',
    description: 'Preview spreadsheets, export sheets to PDF or CSV, and compile CSV files into a workbook.',
    icon: FileSpreadsheet,
  },
  {
    id: '/notebook',
    to: '/notebook',
    title: 'Markdown Notebook',
    description: 'Distraction-free notes with live preview and auto-save. Export to Markdown, HTML, or PDF.',
    icon: NotebookPen,
  },
  {
    id: '/voice',
    to: '/voice',
    title: 'Voice Tools',
    description: 'Dictate text with speech-to-text, or have any text read aloud with text-to-speech.',
    icon: Mic,
  },
  {
    id: '/passwords',
    to: '/passwords',
    title: 'Password Generator',
    description: 'Cryptographically random passphrases and complex passwords with a live entropy meter.',
    icon: KeyRound,
  },
  {
    id: '/image-optimizer',
    to: '/image-optimizer',
    title: 'Image Optimizer',
    description: 'Resize, compress, and convert images to WebP or JPEG — EXIF data stripped automatically.',
    icon: ImageDown,
  },
  {
    id: '/playground',
    to: '/playground',
    title: 'Regex & JSON Playground',
    description: 'Test regular expressions with live match highlighting, plus a JSON formatter and validator.',
    icon: Braces,
  },
  {
    id: '/convert',
    to: '/convert',
    title: 'Unit Converter',
    description: 'Instant offline conversions for length, weight, temperature, and data storage.',
    icon: ArrowRightLeft,
  },
  {
    id: '/colors',
    to: '/colors',
    title: 'Color Tools',
    description: 'Color picker, tint and shade palette generator, and WCAG contrast checking.',
    icon: Palette,
  },
  {
    id: '/media',
    to: '/media',
    title: 'Media Compressor',
    description: 'Trim and re-encode video and audio locally to WebM — no uploads, no ffmpeg server.',
    icon: Clapperboard,
  },
  {
    id: '/checksum',
    to: '/checksum',
    title: 'Checksum Calculator',
    description: 'SHA-256, SHA-1, and MD5 file hashes computed in-memory, with hash comparison.',
    icon: FileCheck2,
  },
  {
    id: '/svg',
    to: '/svg',
    title: 'SVG Optimizer',
    description: 'Strip comments, editor metadata, and empty attributes from SVG markup.',
    icon: FileCode2,
  },
  {
    id: '/diff',
    to: '/diff',
    title: 'Text Diff Checker',
    description: 'Side-by-side line-by-line diff with red/green highlighting, computed locally.',
    icon: GitCompareArrows,
  },
  {
    id: '/expenses',
    to: '/expenses',
    title: 'Expense Tracker',
    description: 'Snap receipts, log vendor/date/amount in your local currency, export an Excel workbook.',
    icon: Receipt,
  },
  {
    id: '/text-tools',
    to: '/text-tools',
    title: 'Text Workbench',
    description: 'Case conversion, line sorting and dedupe, word counts, and lorem ipsum generation.',
    icon: Type,
  },
  {
    id: '/calc-tools',
    to: '/calc-tools',
    title: 'Calc & Time Converter',
    description: 'Percentages, VAT, and timezone conversion — formatted for your device locale.',
    icon: Calculator,
  },
  {
    id: '/timer',
    to: '/timer',
    title: 'Timer & Pomodoro',
    description: 'Stopwatch, countdown presets, and focus/break cycles with notification alerts.',
    icon: Timer,
  },
  {
    id: '/codec',
    to: '/codec',
    title: 'Base64 & URL Codec',
    description: 'Encode and decode Base64 and percent-encoded URLs — Unicode-safe, fully offline.',
    icon: Code2,
  },
  {
    id: '/uuid',
    to: '/uuid',
    title: 'UUID & Random Generator',
    description: 'Bulk UUID v4s, hex tokens, and random integers — cryptographically secure.',
    icon: Hash,
  },
  {
    id: '/cron',
    to: '/cron',
    title: 'Cron Explainer',
    description: 'Decode 5-field cron expressions into plain language plus the next run times.',
    icon: CalendarClock,
  },
  {
    id: '/watermark',
    to: '/watermark',
    title: 'Image Watermarker',
    description: 'Overlay text on photos with position, size, and opacity controls — EXIF stripped.',
    icon: Stamp,
  },
  {
    id: '/screen-recorder',
    to: '/screen-recorder',
    title: 'Screen Recorder',
    description: 'Record screen, window, or tab with optional audio to WebM — saved locally.',
    icon: MonitorPlay,
  },
  {
    id: '/qr-generator',
    to: '/qr-generator',
    title: 'QR Code Generator',
    description: 'Create QR codes for links, text, or Wi-Fi with color and size options — PNG or SVG.',
    icon: QrCode,
  },
  {
    id: '/barcode',
    to: '/barcode',
    title: 'Barcode Generator',
    description: 'Code 128, EAN-13, UPC, and Code 39 barcodes — download as PNG or SVG.',
    icon: Barcode,
  },
  {
    id: '/totp',
    to: '/totp',
    title: 'TOTP Authenticator',
    description: 'Generate 2FA codes from otpauth URIs or Base32 secrets — fully client-side.',
    icon: ShieldCheck,
  },
  {
    id: '/barcode-scanner',
    to: '/barcode-scanner',
    title: 'Barcode Scanner',
    description: 'Read EAN, UPC, Code 39/128, ITF and more via camera or image — decoded locally.',
    icon: ScanBarcode,
  },
  {
    id: '/sql',
    to: '/sql',
    title: 'SQL Sandbox',
    description: 'Run SQL queries in a real SQLite engine via WebAssembly — inspect the schema, import and export .sqlite files.',
    icon: Database,
  },
  {
    id: '/sync',
    to: '/sync',
    title: 'Sync Hub',
    description: 'Move all app data between devices via QR code or JSON file — merge safely or overwrite with a warning gate.',
    icon: RefreshCw,
  },
  {
    id: '/solar',
    to: '/solar',
    title: 'Solar & Battery Autonomy',
    description: 'How long can the battery bank carry the homestead load? Energy, load, and optional solar input.',
    icon: BatteryCharging,
  },
  {
    id: '/rainwater',
    to: '/rainwater',
    title: 'Rainwater Harvesting & Reserve',
    description: 'How much water the roof can catch, and how long the tank lasts without rain.',
    icon: CloudRain,
  },
  {
    id: '/mix',
    to: '/mix',
    title: 'Lime & Concrete Mix Estimator',
    description: 'Binder, sand, and aggregate quantities for mortar, concrete, and screed — in bags and kg.',
    icon: BrickWall,
  },
  {
    id: '/swale',
    to: '/swale',
    title: 'Swale & Gradient Calculator',
    description: 'Slope percentage, 1:X ratio, and excavation volume for trapezoid swale trenches.',
    icon: Waves,
  },
]

const DEFAULT_ORDER = TOOLS.map((tool) => tool.id)

export default function Home() {
  const [favorites, setFavorites] = useState<string[]>(readFavorites)
  const [order, setOrder] = useState<string[]>(() => resolveOrder(readOrder(), DEFAULT_ORDER))
  const [reordering, setReordering] = useState(false)

  const toggleFavorite = (id: string) =>
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((f) => f !== id) : [...current, id]
      writeFavorites(next)
      return next
    })

  const move = (id: string, dir: -1 | 1) =>
    setOrder((current) => {
      const i = current.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= current.length) return current
      const next = [...current]
      const tmp = next[i]
      next[i] = next[j]
      next[j] = tmp
      writeOrder(next)
      return next
    })

  const byId = new Map(TOOLS.map((tool) => [tool.id, tool]))
  const ordered = order
    .map((id) => byId.get(id))
    .filter((tool): tool is Tool => tool !== undefined)
  const favSet = new Set(favorites)
  const favTools = ordered.filter((tool) => favSet.has(tool.id))

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('What do you need today?')}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            {t('A growing collection of everyday utilities that run entirely in your browser — no uploads, no accounts, works offline once installed.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReordering((on) => !on)}
          aria-pressed={reordering}
          className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
            reordering
              ? 'bg-sky-500/15 text-sky-600 hover:bg-sky-500/25 dark:text-sky-400'
              : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowUpDown size={15} />
          {reordering ? t('Done') : t('Reorder tools')}
        </button>
      </div>

      <UpdateBanner />

      {favTools.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {t('Favorites')}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favTools.map((tool) => (
              <ToolCard
                key={tool.id}
                to={tool.to}
                title={t(tool.title)}
                description={t(tool.description)}
                icon={tool.icon}
                favorite
                onToggleFavorite={() => toggleFavorite(tool.id)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((tool, i) => (
          <ToolCard
            key={tool.id}
            to={tool.to}
            title={t(tool.title)}
            description={t(tool.description)}
            icon={tool.icon}
            favorite={favSet.has(tool.id)}
            onToggleFavorite={() => toggleFavorite(tool.id)}
            reordering={reordering}
            onMoveUp={() => move(tool.id, -1)}
            onMoveDown={() => move(tool.id, 1)}
            first={i === 0}
            last={i === ordered.length - 1}
          />
        ))}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
          <Sparkles size={22} className="text-slate-400 dark:text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            {t('More tools coming soon')}
          </p>
        </div>
      </div>
    </div>
  )
}
