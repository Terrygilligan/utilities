import { useRef, useState } from 'react'
import { Download, MonitorPlay, Square, Video } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { saveBlob } from '../lib/download'
import { fmtBytes, fmtNumber } from '../utils/locale'

export default function ScreenRecorder() {
  const [recording, setRecording] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [audio, setAudio] = useState(true)
  const recRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef(0)

  const start = async () => {
    setError(''); setBlob(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio })
      const rec = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm',
      })
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      rec.onstop = () => {
        setBlob(new Blob(chunks, { type: 'video/webm' }))
        stream.getTracks().forEach((t) => t.stop())
        clearInterval(timerRef.current)
        setRecording(false)
      }
      stream.getVideoTracks()[0].onended = () => rec.stop()
      recRef.current = rec
      rec.start(500)
      setSeconds(0)
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
      setRecording(true)
    } catch (e) {
      setError(e instanceof Error && e.name === 'NotAllowedError'
        ? 'Screen share was denied — pick a window or screen to start recording.'
        : 'Recording is not supported in this browser.')
    }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const name = `screen-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.webm`

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Screen Recorder</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Record your screen, window, or tab to WebM — captured and saved entirely on-device.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        {recording ? (
          <>
            <p className="font-mono text-5xl font-bold tabular-nums text-red-500">{mmss}</p>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-red-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Recording{audio ? ' with audio' : ''}
            </p>
            <button type="button" onClick={() => recRef.current?.stop()}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-red-500/15 px-4 text-sm font-medium text-red-600 transition hover:bg-red-500/25 dark:text-red-400">
              <Square size={15} /> Stop recording
            </button>
          </>
        ) : (
          <>
            <MonitorPlay size={40} className="mx-auto text-sky-600 dark:text-sky-400" />
            <label className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={audio} onChange={(e) => setAudio(e.target.checked)} className="accent-sky-500" />
              Include system/tab audio
            </label>
            <button type="button" onClick={() => void start()}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400">
              <Video size={15} /> Start recording
            </button>
            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </>
        )}
      </div>

      {blob && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <video src={URL.createObjectURL(blob)} controls className="w-full rounded-lg" />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">{name} · {fmtBytes(blob.size)} · {fmtNumber(seconds)}s</span>
            <button type="button" onClick={() => saveBlob(blob, name)}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400">
              <Download size={15} /> Download
            </button>
            <ShareButton payload={() => ({ kind: 'file', file: new File([blob], name, { type: 'video/webm' }) })} />
          </div>
        </div>
      )}
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <MonitorPlay size={13} /> Output is WebM (browser-native). Convert to MP4 in Media Tools if needed.
      </p>
      <p className="mt-1 text-xs text-slate-500">Or trim an existing recording:</p>
      <div className="mt-3">
        <FilePicker accept="video/*" icon={Video} title="Drop an existing recording to preview" onFiles={(f) => f[0] && setBlob(f[0])} />
      </div>
    </div>
  )
}
