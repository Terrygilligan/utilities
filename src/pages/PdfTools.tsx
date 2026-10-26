import { useState } from 'react'
import { BookOpen, FileImage, Images } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PdfReader from './pdf/PdfReader'
import ImagesToPdf from './pdf/ImagesToPdf'
import PdfToImages from './pdf/PdfToImages'

type TabId = 'reader' | 'to-pdf' | 'to-images'

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'reader', label: 'PDF Reader', icon: BookOpen },
  { id: 'to-pdf', label: 'Image → PDF', icon: Images },
  { id: 'to-images', label: 'PDF → Images', icon: FileImage },
]

export default function PdfTools() {
  const [tab, setTab] = useState<TabId>('reader')

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">PDF Tools</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Read, build, and convert PDFs entirely on your device — files never leave
        this browser.
      </p>

      <div
        role="tablist"
        aria-label="PDF tools"
        className="mt-6 flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition sm:text-sm ${
              tab === id
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon size={15} className="shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <div className={tab === 'reader' ? 'mt-6' : 'hidden'}>
        <PdfReader />
      </div>
      <div className={tab === 'to-pdf' ? 'mt-6' : 'hidden'}>
        <ImagesToPdf />
      </div>
      <div className={tab === 'to-images' ? 'mt-6' : 'hidden'}>
        <PdfToImages />
      </div>
    </div>
  )
}
