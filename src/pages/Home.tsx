import {
  ArrowRightLeft,
  Barcode,
  CalendarClock,
  Braces,
  Calculator,
  Clapperboard,
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
  ScanBarcode,
  ShieldCheck,
  Sparkles,
  Stamp,
  Timer,
  Type,
} from 'lucide-react'
import ToolCard from '../components/ToolCard'
import { t } from '../utils/i18n'

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t('What do you need today?')}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('A growing collection of everyday utilities that run entirely in your browser — no uploads, no accounts, works offline once installed.')}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard
          to="/pdf"
          title={t('PDF Reader & Converter')}
          description={t('Open, read, and convert PDF documents right on your device. Files never leave your machine.')}
          icon={FileText}
        />
        <ToolCard
          to="/qr-scanner"
          title={t('QR Code Scanner')}
          description={t('Point your camera at a QR code to instantly read links, Wi-Fi credentials, and more.')}
          icon={QrCode}
        />
        <ToolCard
          to="/excel"
          title={t('Excel & CSV Converter')}
          description={t('Preview spreadsheets, export sheets to PDF or CSV, and compile CSV files into a workbook.')}
          icon={FileSpreadsheet}
        />
        <ToolCard
          to="/notebook"
          title={t('Markdown Notebook')}
          description={t('Distraction-free notes with live preview and auto-save. Export to Markdown, HTML, or PDF.')}
          icon={NotebookPen}
        />
        <ToolCard
          to="/voice"
          title={t('Voice Tools')}
          description={t('Dictate text with speech-to-text, or have any text read aloud with text-to-speech.')}
          icon={Mic}
        />
        <ToolCard
          to="/passwords"
          title={t('Password Generator')}
          description={t('Cryptographically random passphrases and complex passwords with a live entropy meter.')}
          icon={KeyRound}
        />
        <ToolCard
          to="/image-optimizer"
          title={t('Image Optimizer')}
          description={t('Resize, compress, and convert images to WebP or JPEG — EXIF data stripped automatically.')}
          icon={ImageDown}
        />
        <ToolCard
          to="/playground"
          title={t('Regex & JSON Playground')}
          description={t('Test regular expressions with live match highlighting, plus a JSON formatter and validator.')}
          icon={Braces}
        />
        <ToolCard
          to="/convert"
          title={t('Unit Converter')}
          description={t('Instant offline conversions for length, weight, temperature, and data storage.')}
          icon={ArrowRightLeft}
        />
        <ToolCard
          to="/colors"
          title={t('Color Tools')}
          description={t('Color picker, tint and shade palette generator, and WCAG contrast checking.')}
          icon={Palette}
        />
        <ToolCard
          to="/media"
          title={t('Media Compressor')}
          description={t('Trim and re-encode video and audio locally to WebM — no uploads, no ffmpeg server.')}
          icon={Clapperboard}
        />
        <ToolCard
          to="/checksum"
          title={t('Checksum Calculator')}
          description={t('SHA-256, SHA-1, and MD5 file hashes computed in-memory, with hash comparison.')}
          icon={FileCheck2}
        />
        <ToolCard
          to="/svg"
          title={t('SVG Optimizer')}
          description={t('Strip comments, editor metadata, and empty attributes from SVG markup.')}
          icon={FileCode2}
        />
        <ToolCard
          to="/diff"
          title={t('Text Diff Checker')}
          description={t('Side-by-side line-by-line diff with red/green highlighting, computed locally.')}
          icon={GitCompareArrows}
        />
        <ToolCard
          to="/expenses"
          title={t('Expense Tracker')}
          description={t('Snap receipts, log vendor/date/amount in your local currency, export an Excel workbook.')}
          icon={Receipt}
        />
        <ToolCard
          to="/text-tools"
          title={t('Text Workbench')}
          description={t('Case conversion, line sorting and dedupe, word counts, and lorem ipsum generation.')}
          icon={Type}
        />
        <ToolCard
          to="/calc-tools"
          title={t('Calc & Time Converter')}
          description={t('Percentages, VAT, and timezone conversion — formatted for your device locale.')}
          icon={Calculator}
        />
        <ToolCard
          to="/timer"
          title={t('Timer & Pomodoro')}
          description={t('Stopwatch, countdown presets, and focus/break cycles with notification alerts.')}
          icon={Timer}
        />
        <ToolCard
          to="/codec"
          title={t('Base64 & URL Codec')}
          description={t('Encode and decode Base64 and percent-encoded URLs — Unicode-safe, fully offline.')}
          icon={Code2}
        />
        <ToolCard
          to="/uuid"
          title={t('UUID & Random Generator')}
          description={t('Bulk UUID v4s, hex tokens, and random integers — cryptographically secure.')}
          icon={Hash}
        />
        <ToolCard
          to="/cron"
          title={t('Cron Explainer')}
          description={t('Decode 5-field cron expressions into plain language plus the next run times.')}
          icon={CalendarClock}
        />
        <ToolCard
          to="/watermark"
          title={t('Image Watermarker')}
          description={t('Overlay text on photos with position, size, and opacity controls — EXIF stripped.')}
          icon={Stamp}
        />
        <ToolCard
          to="/screen-recorder"
          title={t('Screen Recorder')}
          description={t('Record screen, window, or tab with optional audio to WebM — saved locally.')}
          icon={MonitorPlay}
        />
        <ToolCard
          to="/qr-generator"
          title={t('QR Code Generator')}
          description={t('Create QR codes for links, text, or Wi-Fi with color and size options — PNG or SVG.')}
          icon={QrCode}
        />
        <ToolCard
          to="/barcode"
          title={t('Barcode Generator')}
          description={t('Code 128, EAN-13, UPC, and Code 39 barcodes — download as PNG or SVG.')}
          icon={Barcode}
        />
        <ToolCard
          to="/totp"
          title={t('TOTP Authenticator')}
          description={t('Generate 2FA codes from otpauth URIs or Base32 secrets — fully client-side.')}
          icon={ShieldCheck}
        />
        <ToolCard
          to="/barcode-scanner"
          title={t('Barcode Scanner')}
          description={t('Read EAN, UPC, Code 39/128, ITF and more via camera or image — decoded locally.')}
          icon={ScanBarcode}
        />
        <ToolCard
          to="/sql"
          title={t('SQL Sandbox')}
          description={t('Run SQL queries in a real SQLite engine via WebAssembly — inspect the schema, import and export .sqlite files.')}
          icon={Database}
        />
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
