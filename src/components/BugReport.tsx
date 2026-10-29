import { useState } from 'react'
import { Bug, Check, Copy, ExternalLink, X } from 'lucide-react'
import { dataKeys, storageEstimate } from '../lib/backup'
import { t } from '../utils/i18n'

const ISSUES_URL =
  'https://github.com/Terrygilligan/utilities/issues/new?template=bug_report.yml'

export default function BugReport() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyDiagnostics = async () => {
    const report = {
      app: 'utility-hub',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      online: navigator.onLine,
      storageKeys: dataKeys().length,
      storageEstimate: await storageEstimate(),
    }
    const text = JSON.stringify(report, null, 2)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = [
    t('Click "Copy Diagnostics" — this copies technical details like your browser type, screen size, and the page address to your clipboard.'),
    t('🔒 Rest assured: No personal, identifying, or private information is ever collected or shared — only technical diagnostics.'),
    t('Click "Report a Bug" — it opens the GitHub issues page in a new tab.'),
    t('Describe what went wrong in a sentence or two.'),
    t('Paste the diagnostics into the "App diagnostics" box — you can review every detail before submitting. Nothing is sent automatically.'),
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
      >
        <Bug size={12} />
        {t('Report a Bug')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-left dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold">{t('Found a Bug?')}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('Close')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. There is no corporate support desk, and I don\'t have the time or energy to answer individual support emails.')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('However, if you spot a bug or broken feature, let me know anyway! I regularly update and patch the app, so your bug reports go straight into the fix queue for the next update.')}
            </p>
            <ol className="mt-4 space-y-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                    {i + 1}
                  </span>
                  {i === 1 ? (
                    <p className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[13px] font-medium leading-relaxed text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {step}
                    </p>
                  ) : (
                    <p className="flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {step}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => void copyDiagnostics()}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? t('Copied!') : t('Copy Diagnostics')}
              </button>
              <a
                href={ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ExternalLink size={14} />
                {t('Report a Bug')}
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg text-xs text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                {t('Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
