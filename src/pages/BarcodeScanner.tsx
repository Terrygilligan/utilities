import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Barcode, Camera, Check, Copy, ImageUp, ScanLine, TriangleAlert } from 'lucide-react'
import ShareButton from '../components/ShareButton'

const CAM_ID = 'barcode-camera'
const FILE_ID = 'barcode-file'

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
]

const guess = (v: string) =>
  /^\d{13}$/.test(v) ? 'EAN-13' : /^\d{8}$/.test(v) ? 'EAN-8'
  : /^\d{12}$/.test(v) ? 'UPC-A' : /^[0-9A-Z\-. $/+%]+$/i.test(v) ? 'Code 39/128' : 'Barcode'

export default function BarcodeScanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const camRef = useRef<Html5Qrcode | null>(null)
  const fileRef = useRef<Html5Qrcode | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const stop = useCallback(async () => {
    try { if (camRef.current?.isScanning) await camRef.current.stop(); camRef.current?.clear() } catch { /* noop */ }
    setScanning(false)
  }, [])

  const start = useCallback(async () => {
    setError(''); setResult(null)
    try {
      const s = camRef.current ?? new Html5Qrcode(CAM_ID, { formatsToSupport: FORMATS, verbose: false })
      camRef.current = s
      await s.start({ facingMode: 'environment' },
        { fps: 10 },
        (text) => { setResult(text); void stop() },
        () => {})
      setScanning(true)
    } catch (e) {
      setScanning(false)
      const n = e instanceof Error ? e.name : ''
      setError(n.includes('NotAllowed') ? 'Camera permission denied — allow camera access and retry.'
        : !window.isSecureContext ? 'Camera scanning needs HTTPS.'
        : 'Could not start the camera.')
    }
  }, [stop])

  const scanFile = useCallback(async (file?: File) => {
    if (!file) return
    setError('')
    await stop()
    try {
      const s = fileRef.current ?? new Html5Qrcode(FILE_ID, { formatsToSupport: FORMATS, verbose: false })
      fileRef.current = s
      setResult(await s.scanFile(file, false))
    } catch {
      setError('No barcode found in that image — try a sharper, well-lit photo.')
    }
  }, [stop])

  useEffect(() => () => { void stop() }, [stop])

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Barcode Scanner</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Read EAN, UPC, Code 39/93/128, ITF, and Codabar with your camera or from a photo — on-device.
      </p>

      <div id={CAM_ID} className={`mt-6 overflow-hidden rounded-xl ${scanning ? '' : 'hidden'}`} />
      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <TriangleAlert size={18} className="shrink-0" /> {error}
        </div>
      )}

      {!scanning && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void start()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400">
            <Camera size={15} /> Scan with camera
          </button>
          <button type="button" onClick={() => uploadRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400">
            <ImageUp size={15} /> Scan from image
          </button>
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => void scanFile(e.target.files?.[0])} />
        </div>
      )}
      {scanning && (
        <button type="button" onClick={() => void stop()}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 transition hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800">
          <ScanLine size={15} /> Stop camera
        </button>
      )}

      {result && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Barcode size={13} /> {guess(result)}
          </p>
          <p className="mt-1 break-all font-mono text-xl font-bold">{result}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={async () => { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1200) }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400">
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied!' : 'Copy'}
            </button>
            <ShareButton payload={() => ({ kind: 'text', text: result })} />
          </div>
        </div>
      )}
      <div id={FILE_ID} className="hidden" />
    </div>
  )
}
