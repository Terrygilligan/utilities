import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Trash2,
  TriangleAlert,
  Volume2,
} from 'lucide-react'
import ShareButton from '../components/ShareButton'

interface RecognitionAlternativeLike {
  transcript: string
}
interface RecognitionResultLike {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: RecognitionAlternativeLike
}
interface RecognitionEventLike {
  readonly resultIndex: number
  readonly results: ArrayLike<RecognitionResultLike>
}
interface RecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: RecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type SpeechRecognitionCtor = new () => RecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const RECOGNITION_ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone permission denied — allow mic access and try again.',
  'service-not-allowed': 'Speech recognition is not allowed in this browser context.',
  'no-speech': 'No speech detected — try again.',
  'audio-capture': 'No microphone found on this device.',
  network: "This browser's speech engine needs a network connection.",
}

function SpeechToTextCard() {
  const [supported] = useState(() => getRecognitionCtor() !== null)
  const [listening, setListening] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interim, setInterim] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<RecognitionLike | null>(null)
  const wantListeningRef = useRef(false)

  const stop = useCallback(() => {
    wantListeningRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      setListening(false)
    }
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    setError(null)
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language
    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) setFinalText((current) => current + transcript)
        else interimText += transcript
      }
      setInterim(interimText)
    }
    recognition.onerror = (event) => {
      setError(RECOGNITION_ERRORS[event.error] ?? `Recognition error: ${event.error}`)
      wantListeningRef.current = false
      setListening(false)
    }
    recognition.onend = () => {
      if (wantListeningRef.current) {
        try {
          recognition.start()
          return
        } catch {
          // fall through to stopped state
        }
      }
      setListening(false)
      setInterim('')
    }
    recRef.current = recognition
    wantListeningRef.current = true
    try {
      recognition.start()
      setListening(true)
    } catch {
      setListening(false)
      setError('Could not start speech recognition.')
    }
  }, [])

  useEffect(() => {
    return () => {
      wantListeningRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        // already stopped
      }
    }
  }, [])

  const copyTranscript = useCallback(async () => {
    const text = (finalText + interim).trim()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed — select the transcript text to copy it manually.')
    }
  }, [finalText, interim])

  const transcript = finalText + interim

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
          <Mic size={17} />
        </span>
        <h2 className="text-base font-semibold">Speech to text</h2>
        {listening && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
            Listening
          </span>
        )}
      </div>

      {!supported ? (
        <p className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 p-4 text-sm text-slate-600 dark:text-slate-400">
          Speech recognition isn&apos;t available in this browser — try Chrome,
          Edge, or Safari.
        </p>
      ) : (
        <>
          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              <TriangleAlert size={18} className="shrink-0" />
              {error}
            </div>
          )}
          <div className="mt-4 min-h-40 rounded-xl bg-slate-100 dark:bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {transcript ? (
              <>
                {finalText}
                <span className="text-slate-500">{interim}</span>
              </>
            ) : (
              <span className="text-slate-500">
                Your transcript appears here as you speak…
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {listening ? (
              <button
                type="button"
                onClick={stop}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-500/15 px-4 text-sm font-medium text-red-600 dark:text-red-300 transition hover:bg-red-500/25"
              >
                <MicOff size={16} />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={start}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25"
              >
                <Mic size={16} />
                Start listening
              </button>
            )}
            <button
              type="button"
              onClick={copyTranscript}
              disabled={!transcript.trim()}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? <Check size={16} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy text'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFinalText('')
                setInterim('')
              }}
              disabled={!transcript}
              aria-label="Clear transcript"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
            >
              <Trash2 size={16} />
            </button>
            <ShareButton
              disabled={!transcript.trim()}
              payload={() =>
                transcript.trim()
                  ? { kind: 'text', text: transcript.trim(), title: 'Transcript' }
                  : null
              }
            />
          </div>
        </>
      )}
    </section>
  )
}

function TextToSpeechCard() {
  const [supported] = useState(() => 'speechSynthesis' in window)
  const [text, setText] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }, [])

  const pauseResume = useCallback(() => {
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }, [paused])

  const speak = useCallback(() => {
    if (!text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = navigator.language
    utterance.onend = () => {
      setSpeaking(false)
      setPaused(false)
    }
    utterance.onerror = () => {
      setSpeaking(false)
      setPaused(false)
    }
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    setPaused(false)
  }, [text])

  useEffect(() => {
    return () => window.speechSynthesis.cancel()
  }, [])

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
          <Volume2 size={17} />
        </span>
        <h2 className="text-base font-semibold">Text to speech</h2>
        {speaking && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Playing
          </span>
        )}
      </div>

      {!supported ? (
        <p className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 p-4 text-sm text-slate-600 dark:text-slate-400">
          Text-to-speech isn&apos;t available in this browser.
        </p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type or paste text to read aloud…"
            className="mt-4 min-h-40 w-full resize-y rounded-xl border border-transparent bg-slate-100 dark:bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-sky-500/60"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {speaking ? (
              <>
                <button
                  type="button"
                  onClick={pauseResume}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25"
                >
                  {paused ? <Play size={16} /> : <Pause size={16} />}
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-500/15 px-4 text-sm font-medium text-red-600 dark:text-red-300 transition hover:bg-red-500/25"
                >
                  <Square size={15} />
                  Stop
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={speak}
                disabled={!text.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play size={16} />
                Read aloud
              </button>
            )}
            <span className="ml-auto text-xs text-slate-500">
              {text.length} chars · uses your device&apos;s system voices
            </span>
          </div>
        </>
      )}
    </section>
  )
}

export default function VoiceTools() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Voice Tools</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Dictate notes or have text read aloud — powered by your browser&apos;s
        built-in speech features. No sign-in, nothing uploaded.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SpeechToTextCard />
        <TextToSpeechCard />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Text-to-speech runs entirely on-device. Speech recognition uses your
        browser&apos;s built-in engine — on Chrome and Edge, audio is processed
        by the browser&apos;s speech service rather than locally.
      </p>
    </div>
  )
}
