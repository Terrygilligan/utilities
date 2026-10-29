import { useState } from 'react'
import { Check, Copy, Download, Loader2, ScanText, Trash2 } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import { saveBlob } from '../lib/download'
import { ocrImageFile } from '../lib/ocr'
import { t } from '../utils/i18n'

export default function PhotoToText() {
  const [preview, setPreview] = useState('')
  const [text, setText] = useState('')
  const [scanning, setScanning] = useState(false)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  const scan = async (file: File) => {
    setScanning(true)
    setNote('')
    setText('')
    try {
      const result = await ocrImageFile(file)
      const trimmed = result.trim()
      setText(result)
      if (!trimmed) setNote(t('No text recognized — try a clearer, higher-contrast photo.'))
    } catch (err) {
      console.error('OCR failed:', err)
      setNote(t('Text scan failed — try a different image.'))
    } finally {
      setScanning(false)
    }
  }

  const pick = (files: File[]) => {
    const f = files[0]
    if (!f) return
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(f))
    void scan(f)
  }

  const copy = async () => {
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

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    setText('')
    setNote('')
  }

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400 disabled:opacity-40'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Photo → Text OCR')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Pull editable text out of photos and screenshots — OCR runs on your device, nothing is uploaded.')}
      </p>

      <div className="mt-6">
        <FilePicker
          accept="image/*"
          onFiles={pick}
          title={t('Drop a photo or screenshot')}
          subtitle={t('English + Bulgarian OCR — nothing is uploaded')}
          icon={ScanText}
        />
      </div>

      {scanning && (
        <div className="mt-6 flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400">
          <Loader2 size={16} className="animate-spin" />
          {t('Reading text…')}
        </div>
      )}
      {note && <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">{note}</p>}

      {(preview || text) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {preview && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <img src={preview} alt="" className="max-h-72 w-full rounded-lg object-contain" />
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950/60"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copy()} disabled={!text} className={btn}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? t('Copied!') : t('Copy')}
              </button>
              <button
                type="button"
                onClick={() => saveBlob(new Blob([text], { type: 'text/plain' }), 'ocr-text.txt')}
                disabled={!text}
                className={btn}
              >
                <Download size={15} />
                {t('Download .txt')}
              </button>
              <button type="button" onClick={clear} className={btn}>
                <Trash2 size={15} />
                {t('Clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
