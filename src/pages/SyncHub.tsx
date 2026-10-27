import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  CameraOff,
  Download,
  FileUp,
  Loader2,
  QrCode,
  RefreshCw,
  ScanLine,
  TriangleAlert,
} from 'lucide-react'
import FilePicker from '../components/FilePicker'
import { saveBlob } from '../lib/download'
import { fmtBytes, fmtDateTime } from '../utils/locale'
import {
  decodePayload,
  encodePayload,
  mergeData,
  overwriteData,
  snapshotPayload,
} from '../lib/sync'
import type { Snapshot } from '../lib/sync'

const CAMERA_ID = 'sync-camera-view'
const FILE_ID = 'sync-file-reader'

export default function SyncHub() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [payload, setPayload] = useState('')
  const [qrError, setQrError] = useState('')
  const [phase, setPhase] = useState<'idle' | 'starting' | 'scanning'>('idle')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [incoming, setIncoming] = useState<Snapshot | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraRef = useRef<Html5Qrcode | null>(null)
  const fileScannerRef = useRef<Html5Qrcode | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const s = snapshotPayload()
    setSnap(s)
    void encodePayload(s).then(async (p) => {
      setPayload(p)
      try {
        const QR = await import('qrcode')
        await QR.toCanvas(canvasRef.current, p, {
          width: 512,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' },
        })
      } catch {
        setQrError(
          'Snapshot is too large for a single QR code — use the JSON file export instead.',
        )
      }
    })
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

  const stopCamera = useCallback(async () => {
    const scanner = cameraRef.current
    if (scanner?.isScanning) {
      try {
        await scanner.stop()
        scanner.clear()
      } catch {
        // already stopped
      }
    }
    setPhase('idle')
  }, [])

  const acceptPayload = useCallback(
    (text: string) => {
      void decodePayload(text)
        .then((s) => {
          setIncoming(s)
          setConfirmWipe(false)
          void stopCamera()
        })
        .catch(() => setError('That does not look like a Utility Hub snapshot.'))
    },
    [stopCamera],
  )

  const startCamera = useCallback(async () => {
    setError('')
    setPhase('starting')
    try {
      const scanner = cameraRef.current ?? new Html5Qrcode(CAMERA_ID)
      cameraRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => acceptPayload(text),
        () => {},
      )
      setPhase('scanning')
    } catch {
      setPhase('idle')
      setError('Could not start the camera — allow permission or scan an image file instead.')
    }
  }, [acceptPayload])

  const scanImage = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setError('')
    if (cameraRef.current?.isScanning) await stopCamera()
    try {
      const scanner = fileScannerRef.current ?? new Html5Qrcode(FILE_ID, false)
      fileScannerRef.current = scanner
      acceptPayload(await scanner.scanFile(file, false))
    } catch {
      setError('No QR code could be found in that image.')
    }
  }

  const doMerge = () => {
    if (!incoming) return
    const r = mergeData(incoming.data)
    setIncoming(null)
    setNote(
      `Merged ${r.keys} keys — ${r.written} written, ${r.unchanged} already up to date. Other tools pick up the data on next open.`,
    )
    setSnap(snapshotPayload())
  }

  const doOverwrite = () => {
    if (!incoming) return
    overwriteData(incoming.data)
    window.alert('Incoming snapshot applied. The app will now reload.')
    window.location.reload()
  }

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition'
  const card =
    'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Sync Hub</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Move all Utility Hub data (expenses, notes, settings) between devices —
        as a QR code for small snapshots or a JSON file for larger ones. Everything stays on-device.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className="text-sm font-semibold">Send to another device</p>
          <p className="mt-1 text-xs text-slate-500">
            {snap ? `${Object.keys(snap.data).length} keys` : '…'}
            {payload && ` · ${fmtBytes(payload.length)} payload`}
          </p>
          {!qrError ? (
            <canvas ref={canvasRef} className="mx-auto mt-4 max-w-full rounded-lg bg-white p-2" />
          ) : (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <TriangleAlert size={15} className="mt-0.5 shrink-0" /> {qrError}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={!snap}
              onClick={() => {
                if (!snap) return
                saveBlob(
                  new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' }),
                  `utility-hub-snapshot-${snap.exportedAt.slice(0, 10)}.json`,
                )
              }}
              className={`${btn} flex-1 justify-center bg-sky-500/15 text-sky-600 hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400`}>
              <Download size={15} /> Download JSON
            </button>
          </div>
        </div>

        <div className={card}>
          <p className="text-sm font-semibold">Receive on this device</p>
          <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-800">
            <div id={CAMERA_ID} className="absolute inset-0" />
            {phase !== 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <ScanLine size={24} className="text-sky-400" />
                <p className="text-xs text-slate-400">
                  {phase === 'starting' ? 'Starting camera…' : 'Camera is off'}
                </p>
              </div>
            )}
          </div>
          <div id={FILE_ID} className="hidden" />
          <div className="mt-3 flex flex-wrap gap-2">
            {phase === 'scanning' ? (
              <button type="button" onClick={() => void stopCamera()}
                className={`${btn} bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-300`}>
                <CameraOff size={15} /> Stop
              </button>
            ) : (
              <button type="button" onClick={() => void startCamera()} disabled={phase !== 'idle'}
                className={`${btn} bg-sky-500/15 text-sky-600 hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400`}>
                {phase === 'starting' ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                Scan QR
              </button>
            )}
            <button type="button" onClick={() => fileRef.current?.click()}
              className={`${btn} text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800`}>
              <FileUp size={15} /> Import JSON
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void f.text().then(acceptPayload)
              }} />
          </div>
          <div className="mt-3">
            <FilePicker accept="image/*" title="Or drop a QR screenshot" icon={QrCode} onFiles={(f) => void scanImage(f)} />
          </div>
          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">
              <TriangleAlert size={15} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
          {note && <p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">{note}</p>}
        </div>
      </div>

      {incoming && !confirmWipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-base font-semibold">Import snapshot?</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {Object.keys(incoming.data).length} keys
              {incoming.exportedAt && ` · exported ${fmtDateTime(incoming.exportedAt)}`}
            </p>
            <div className="mt-5 space-y-2">
              <button type="button" onClick={doMerge}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 text-sm font-semibold text-white transition hover:bg-sky-400">
                <RefreshCw size={15} /> Merge data (safe)
              </button>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Combines records by id — on a match, the entry with the newest updatedAt wins.
              </p>
              <button type="button" onClick={() => setConfirmWipe(true)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-red-300 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 dark:border-red-800 dark:text-red-400">
                Overwrite app data
              </button>
              <button type="button" onClick={() => setIncoming(null)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg text-xs text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {incoming && confirmWipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-300 bg-white p-6 dark:border-red-800 dark:bg-slate-900">
            <p className="flex items-center gap-2 text-base font-semibold text-red-600 dark:text-red-400">
              <TriangleAlert size={18} /> Final warning
            </p>
            <p className="mt-3 text-sm font-semibold uppercase leading-relaxed text-red-600 dark:text-red-300">
              This will permanently erase all existing Utility Suite data (expenses, notes,
              settings) on this device and replace it with the incoming backup. This cannot be undone.
            </p>
            <div className="mt-5 space-y-2">
              <button type="button" onClick={doOverwrite}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-red-600 text-sm font-semibold text-white transition hover:bg-red-500">
                Erase &amp; overwrite
              </button>
              <button type="button" onClick={() => setConfirmWipe(false)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg text-xs text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800">
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
