import {
  ArrowRightLeft,
  Braces,
  Clapperboard,
  FileCheck2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  ImageDown,
  KeyRound,
  Mic,
  NotebookPen,
  Palette,
  QrCode,
  Sparkles,
} from 'lucide-react'
import ToolCard from '../components/ToolCard'

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        What do you need today?
      </h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        A growing collection of everyday utilities that run entirely in your
        browser — no uploads, no accounts, works offline once installed.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard
          to="/pdf"
          title="PDF Reader & Converter"
          description="Open, read, and convert PDF documents right on your device. Files never leave your machine."
          icon={FileText}
        />
        <ToolCard
          to="/qr-scanner"
          title="QR Code Scanner"
          description="Point your camera at a QR code to instantly read links, Wi-Fi credentials, and more."
          icon={QrCode}
        />
        <ToolCard
          to="/excel"
          title="Excel & CSV Converter"
          description="Preview spreadsheets, export sheets to PDF or CSV, and compile CSV files into a workbook."
          icon={FileSpreadsheet}
        />
        <ToolCard
          to="/notebook"
          title="Markdown Notebook"
          description="Distraction-free notes with live preview and auto-save. Export to Markdown, HTML, or PDF."
          icon={NotebookPen}
        />
        <ToolCard
          to="/voice"
          title="Voice Tools"
          description="Dictate text with speech-to-text, or have any text read aloud with text-to-speech."
          icon={Mic}
        />
        <ToolCard
          to="/passwords"
          title="Password Generator"
          description="Cryptographically random passphrases and complex passwords with a live entropy meter."
          icon={KeyRound}
        />
        <ToolCard
          to="/image-optimizer"
          title="Image Optimizer"
          description="Resize, compress, and convert images to WebP or JPEG — EXIF data stripped automatically."
          icon={ImageDown}
        />
        <ToolCard
          to="/playground"
          title="Regex & JSON Playground"
          description="Test regular expressions with live match highlighting, plus a JSON formatter and validator."
          icon={Braces}
        />
        <ToolCard
          to="/convert"
          title="Unit Converter"
          description="Instant offline conversions for length, weight, temperature, and data storage."
          icon={ArrowRightLeft}
        />
        <ToolCard
          to="/colors"
          title="Color Tools"
          description="Color picker, tint and shade palette generator, and WCAG contrast checking."
          icon={Palette}
        />
        <ToolCard
          to="/media"
          title="Media Compressor"
          description="Trim and re-encode video and audio locally to WebM — no uploads, no ffmpeg server."
          icon={Clapperboard}
        />
        <ToolCard
          to="/checksum"
          title="Checksum Calculator"
          description="SHA-256, SHA-1, and MD5 file hashes computed in-memory, with hash comparison."
          icon={FileCheck2}
        />
        <ToolCard
          to="/svg"
          title="SVG Optimizer"
          description="Strip comments, editor metadata, and empty attributes from SVG markup."
          icon={FileCode2}
        />
        <ToolCard
          to="/diff"
          title="Text Diff Checker"
          description="Side-by-side line-by-line diff with red/green highlighting, computed locally."
          icon={GitCompareArrows}
        />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
          <Sparkles size={22} className="text-slate-400 dark:text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            More tools coming soon
          </p>
        </div>
      </div>
    </div>
  )
}
