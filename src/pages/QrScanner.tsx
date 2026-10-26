import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  CameraOff,
  Check,
  Copy,
  ExternalLink,
  ImageUp,
  Loader2,
  ScanLine,
  TriangleAlert,
} from 'lucide-react'
import ShareButton from '../components/ShareButton'

const CAMERA_ELEMENT_ID = 'qr-camera-view'
const FILE_ELEMENT_ID = 'qr-file-reader'

type Phase = 'idle' | 'starting' | 'scanning' | 'stopping'

function describeCameraError(error: unknown): string {
  const name = error instanceof Error ? error.name : String(error)
  if (!window.isSecureContext)
    return 'Camera scanning needs a secure context — use the hosted site or localhost over HTTPS.'
  if (name.includes('NotAllowedError'))
    return 'Camera permission denied — allow camera access in the browser and try again.'
  if (name.includes('NotFoundError') || name.includes('OverconstrainedError'))
    return 'No rear camera found on this device.'
  if (name.includes('NotReadableError'))
    return 'The camera is already in use by another app.'
  return 'Could not start the camera.'
}

export default function QrScanner() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const cameraRef = useRef<Html5Qrcode | null>(null)
  const fileScannerRef = useRef<Html5Qrcode | null>(null)
  const uploadId = useId()

  const stopCamera = useCallback(async () => {
    const scanner = cameraRef.current
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
      scanner.clear()
    } catch {
      // already stopped
    }
    setPhase('idle')
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    setPhase('starting')
    try {
      const scanner = cameraRef.current ?? new Html5Qrcode(CAMERA_ELEMENT_ID)
      cameraRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7)
            return { width: edge, height: edge }
          },
        },
        (decodedText) => {
          setResult(decodedText)
          setCopied(false)
          void stopCamera()
        },
        () => {},
      )
      setPhase('scanning')
    } catch (startError) {
      setPhase('idle')
      setError(describeCameraError(startError))
    }
  }, [stopCamera])

  const scanImageFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      setError(null)
      if (cameraRef.current?.isScanning) await stopCamera()
      try {
        const scanner = fileScannerRef.current ?? new Html5Qrcode(FILE_ELEMENT_ID, false)
        fileScannerRef.current = scanner
        const text = await scanner.scanFile(file, false)
        setResult(text)
        setCopied(false)
      } catch {
        setError('No QR code could be found in that image.')
      }
    },
    [stopCamera],
  )

  useEffect(() => {
    return () => {
      const scanner = cameraRef.current
      if (scanner?.isScanning) {
        void scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {})
      }
    }
  }, [])

  const copyResult = useCallback(async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
    } catch {
      setError('Copy failed — long-press the result text to copy it manually.')
    }
  }, [result])

  const isLink = result !== null && /^https?:\/\//i.test(result)

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">QR Code Scanner</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Scan with your camera or decode a saved image. Everything happens
        on-device — nothing is uploaded.
      </p>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          <TriangleAlert size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-black sm:aspect-video">
        <div id={CAMERA_ELEMENT_ID} className="absolute inset-0" />
        {phase !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
              <ScanLine size={26} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {phase === 'starting'
                ? 'Starting camera…'
                : phase === 'stopping'
                  ? 'Stopping camera…'
                  : 'Camera is off'}
            </p>
            {phase === 'idle' && (
              <p className="max-w-xs px-4 text-xs leading-relaxed text-slate-500">
                You&apos;ll be asked for camera permission the first time. The
                camera turns off automatically after a successful scan.
              </p>
            )}
          </div>
        )}
      </div>
      <div id={FILE_ELEMENT_ID} className="hidden" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {phase === 'scanning' ? (
          <button
            type="button"
            onClick={() => void stopCamera()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-500/15 px-4 text-sm font-medium text-red-600 dark:text-red-300 transition hover:bg-red-500/25"
          >
            <CameraOff size={16} />
            Stop camera
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={phase !== 'idle'}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === 'idle' ? (
              <Camera size={16} />
            ) : (
              <Loader2 size={16} className="animate-spin" />
            )}
            {phase === 'starting'
              ? 'Starting…'
              : phase === 'stopping'
                ? 'Stopping…'
                : 'Start scanning'}
          </button>
        )}

        <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

        <label
          htmlFor={uploadId}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
        >
          <ImageUp size={16} />
          Scan image file
          <input
            id={uploadId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              void scanImageFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
      </div>

      {result !== null && (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Scanned result
          </p>
          <p className="mt-2 break-all font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100">
            {result}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyResult}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-800 px-4 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-300 dark:hover:bg-slate-700"
            >
              {copied ? <Check size={16} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy text'}
            </button>
            {isLink && (
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25"
              >
                <ExternalLink size={16} />
                Open link
              </a>
            )}
            <ShareButton
              payload={() =>
                result ? { kind: 'text', text: result, title: 'QR scan result' } : null
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
