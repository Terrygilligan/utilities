import { useEffect, useRef, useState } from 'react'
import { Bell, Pause, Play, RotateCcw, Timer } from 'lucide-react'

type Mode = 'stopwatch' | 'countdown' | 'pomodoro'

const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

function notify(msg: string) {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') new Notification(msg)
    else if (Notification.permission !== 'denied') void Notification.requestPermission()
  }
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.frequency.value = 880
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    o.start(); o.stop(ctx.currentTime + 0.4)
  } catch { /* no audio device */ }
}

export default function TimerTools() {
  const [mode, setMode] = useState<Mode>('stopwatch')
  const [elapsed, setElapsed] = useState(0)          // stopwatch ms
  const [remain, setRemain] = useState(5 * 60_000)   // countdown ms
  const [mins, setMins] = useState(25)               // countdown/pomo duration
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'focus' | 'break'>('focus')
  const [pomoCount, setPomoCount] = useState(0)
  const last = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    last.current = performance.now()
    const iv = setInterval(() => {
      const now = performance.now()
      const d = now - last.current
      last.current = now
      if (mode === 'stopwatch') setElapsed((e) => e + d)
      else setRemain((r) => {
        const nr = r - d
        if (nr <= 0) {
          if (mode === 'pomodoro') {
            const isBreak = phase === 'focus'
            notify(isBreak ? 'Focus done — break time' : 'Break over — back to it')
            if (isBreak) setPomoCount((c) => c + 1)
            setPhase(isBreak ? 'break' : 'focus')
            return (isBreak ? 5 : mins) * 60_000
          }
          setRunning(false)
          notify('Timer finished')
          return 0
        }
        return nr
      })
    }, 250)
    return () => clearInterval(iv)
  }, [running, mode, phase, mins])

  const setPreset = (m: number) => { setMins(m); setRemain(m * 60_000); setRunning(false) }
  const btn = 'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400'
  const ghost = 'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 transition hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'

  const display = mode === 'stopwatch' ? elapsed : remain

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Timer &amp; Pomodoro</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Stopwatch, countdown, and focus cycles — with a sound + notification when time's up.
      </p>

      <div className="mt-6 flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {(['stopwatch', 'countdown', 'pomodoro'] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setRunning(false); setRemain(mins * 60_000) }}
            className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-medium capitalize transition sm:text-sm ${mode === m ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}>
            {m}
          </button>
        ))}
      </div>

      {mode !== 'stopwatch' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 5, 10, 15, 25, 45].map((m) => (
            <button key={m} type="button" onClick={() => setPreset(m)}
              className={`h-8 rounded-lg border px-3 text-xs font-medium transition ${mins === m ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}>
              {m} min
            </button>
          ))}
          <input type="number" min={1} max={480} value={mins}
            onChange={(e) => setPreset(Math.max(1, Math.min(480, +e.target.value || 1)))}
            className="h-8 w-16 rounded-lg border border-slate-300 bg-white px-2 text-center text-xs dark:border-slate-700 dark:bg-slate-950/60" />
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white py-10 text-center dark:border-slate-800 dark:bg-slate-900">
        {mode === 'pomodoro' && (
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500">
            {phase === 'focus' ? 'Focus' : 'Break'} · cycle {pomoCount}
          </p>
        )}
        <p className="font-mono text-6xl font-bold tabular-nums tracking-tight sm:text-7xl">{fmt(display)}</p>
        <div className="mt-8 flex justify-center gap-2">
          <button type="button" onClick={() => setRunning((r) => !r)} className={btn}>
            {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : 'Start'}
          </button>
          <button type="button" onClick={() => { setRunning(false); setElapsed(0); setRemain(mins * 60_000); setPhase('focus'); setPomoCount(0) }} className={ghost}>
            <RotateCcw size={16} /> Reset
          </button>
          {('Notification' in window) && Notification.permission !== 'granted' && (
            <button type="button" onClick={() => void Notification.requestPermission()} className={ghost}>
              <Bell size={15} /> Enable alerts
            </button>
          )}
        </div>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Timer size={13} /> Keep this tab open — timers pause when the browser suspends the page.
      </p>
    </div>
  )
}
