import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { saveBlob } from '../lib/download'
import { t } from '../utils/i18n'

export type SharePayload =
  | { kind: 'text'; text: string; title?: string }
  | { kind: 'file'; file: File }

export default function ShareButton({
  payload,
  disabled,
}: {
  payload: () => SharePayload | null | Promise<SharePayload | null>
  disabled?: boolean
}) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const flash = (text: string) => {
    setFeedback(text)
    window.setTimeout(() => setFeedback(null), 2000)
  }

  const handleShare = async () => {
    setBusy(true)
    try {
      const data = await payload()
      if (!data) return
      if (data.kind === 'file') {
        const shareData = { files: [data.file] }
        if (typeof navigator.share === 'function' && navigator.canShare?.(shareData)) {
          try {
            await navigator.share(shareData)
            flash(t('Shared'))
          } catch {
            // user dismissed the share sheet
          }
        } else {
          saveBlob(data.file, data.file.name)
          flash(t('Saved'))
        }
      } else if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ text: data.text, title: data.title })
          flash(t('Shared'))
        } catch {
          // user dismissed the share sheet
        }
      } else {
        await navigator.clipboard.writeText(data.text)
        flash(t('Copied!'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      disabled={disabled || busy}
      className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {feedback ? (
        <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Share2 size={16} />
      )}
      {feedback ?? t('Share')}
    </button>
  )
}
