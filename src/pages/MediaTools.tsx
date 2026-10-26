import { useCallback, useEffect, useRef, useState } from 'react'
import { Clapperboard, Download, Loader2, TriangleAlert } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import ShareButton from '../components/ShareButton'
import { saveBlob, baseName } from '../lib/download'

export default function MediaTools() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const urlRef = useRef('')

  const pick = useCallback((f: File) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    const u = URL.createObjectURL(f)
    urlRef.current = u
    setUrl(u)
    setFile(f)
    setDone(false)
    setError(null)
  }, [])

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  const isVideo = !!file?.type.startsWith('video/')

  const processFile = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || !file) return null
    type Capturable = HTMLMediaElement & {
      captureStream?: () => MediaStream
      mozCaptureStream?: () => MediaStream
    }
    const el: Capturable = isVideo
      ? video
      : Object.assign(document.createElement('audio'), { src: url })

    const stream = el.captureStream?.() ?? el.mozCaptureStream?.()
    if (!stream) throw new Error('captureStream unsupported')
    if (!window.MediaRecorder) throw new Error('MediaRecorder unsupported')

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'audio/webm'
    const recorder = new MediaRecorder(stream, { mimeType: isVideo ? mime : 'audio/webm' })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)

    await new Promise<void>((resolve, reject) => {
      el.onerror = () => reject(new Error('media error'))
      el.currentTime = start
      el.onseeked = () => resolve()
    })
    recorder.start(500)
    await el.play()

    await new Promise<void>((resolve) => {
      const check = () => {
        if (el.currentTime >= end || el.ended) resolve()
        else requestAnimationFrame(check)
      }
      check()
    })
    el.pause()
    recorder.stop()
    await new Promise<void>((r) => { recorder.onstop = () => r() })
    stream.getTracks().forEach((t) => t.stop())
    return new Blob(chunks, { type: isVideo ? 'video/webm' : 'audio/webm' })
  }, [file, isVideo, url, start, end])

  const outName = file ? `${baseName(file.name)}-clip.webm` : 'clip.webm'

  const run = async (then?: (b: Blob) => void) => {
    setBusy(true)
    setError(null)
    try {
      const blob = await processFile()
      if (blob) {
        setDone(true)
        then ? then(blob) : saveBlob(blob, outName)
      }
    } catch {
      setError(
        'Could not process that media. The browser needs captureStream + MediaRecorder support (Chrome/Edge work best). Output is WebM.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Media Compressor &amp; Trimmer</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Trim and re-encode video/audio locally. Plays through in real time — nothing is uploaded.
      </p>

      {!file ? (
        <FilePicker
          accept="video/*,audio/*"
          title="Drop a video or audio file"
          subtitle="Re-encoded to WebM entirely in your browser"
          icon={Clapperboard}
          onFiles={(files) => files[0] && pick(files[0])}
        />
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {isVideo ? (
              <video ref={videoRef} src={url} controls
                onLoadedMetadata={(e) => { const d = e.currentTarget.duration; setDuration(d); setEnd(d) }}
                className="max-h-64 w-full rounded-xl bg-black" />
            ) : (
              <audio ref={(el) => { if (el) videoRef.current = el as unknown as HTMLVideoElement }}
                src={url} controls
                onLoadedMetadata={(e) => { const d = e.currentTarget.duration; setDuration(d); setEnd(d) }}
                className="w-full" />
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['Start', start, setStart, 0, end],
                  ['End', end, setEnd, start, duration],
                ] as const
              ).map(([label, val, set, min, max]) => (
                <label key={label} className="text-sm">
                  <span className="flex justify-between text-slate-700 dark:text-slate-300">
                    {label} <b className="tabular-nums text-sky-600 dark:text-sky-400">{val.toFixed(1)}s</b>
                  </span>
                  <input type="range" min={min} max={Math.max(max, 0.1)} step={0.1} value={val}
                    onChange={(e) => set(+e.target.value)} className="mt-2 w-full accent-sky-500" />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {duration ? `${duration.toFixed(1)}s total · clip ${(end - start).toFixed(1)}s` : 'loading…'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" disabled={busy || !duration || end <= start}
              onClick={() => void run()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {busy ? 'Processing…' : 'Trim & download WebM'}
            </button>
            <ShareButton disabled={busy || !duration}
              payload={async () => {
                const b = await processFile()
                return b ? { kind: 'file', file: new File([b], outName, { type: 'video/webm' }) } : null
              }} />
            <button type="button" onClick={() => { setFile(null); setUrl(''); urlRef.current = '' }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Choose a different file
            </button>
            {done && <span className="text-xs text-emerald-600 dark:text-emerald-400">Processed</span>}
          </div>
          {busy && <p className="mt-3 text-xs text-slate-500">Playing through the clip — leave this tab focused.</p>}
          {error && (
            <p className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <TriangleAlert size={15} /> {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
