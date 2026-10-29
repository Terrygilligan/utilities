import { useState } from 'react'
import { Check, Copy, Dice5, RefreshCw } from 'lucide-react'
import ShareButton from '../components/ShareButton'
import { t } from '../utils/i18n'

const randInt = (max: number) => {
  const limit = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  do { crypto.getRandomValues(buf) } while (buf[0] >= limit)
  return buf[0] % max
}
const randHex = (bytes: number) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('')

export default function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)
  const [hexLen, setHexLen] = useState(16)
  const [hexOut, setHexOut] = useState('')
  const [lo, setLo] = useState('1')
  const [hi, setHi] = useState('100')
  const [intOut, setIntOut] = useState<number | null>(null)
  const [copied, setCopied] = useState('')

  const copy = async (s: string, id: string) => {
    await navigator.clipboard.writeText(s)
    setCopied(id); setTimeout(() => setCopied(''), 1500)
  }

  const box = 'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'
  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 text-xs font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400'
  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/60'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('UUID & Random Generator')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Cryptographically secure UUIDs, hex tokens, and random integers — all via crypto.getRandomValues.')}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className={`${box} lg:col-span-2`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('UUID v4')}</h3>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.max(1, Math.min(50, +e.target.value || 1)))} className="h-8 w-16 rounded-lg border border-slate-300 bg-white px-2 text-center text-xs dark:border-slate-700 dark:bg-slate-950/60" />
              <button type="button" onClick={() => setUuids(Array.from({ length: count }, () => crypto.randomUUID()))} className={btn}>
                <RefreshCw size={13} /> {t('Generate')}
              </button>
            </div>
          </div>
          {uuids.length > 0 && (
            <>
              <ul className="mt-3 max-h-56 space-y-1 overflow-auto font-mono text-xs text-slate-700 dark:text-slate-300">
                {uuids.map((u) => (
                  <li key={u} className="flex items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1 dark:bg-slate-950/40">
                    {u}
                    <button type="button" onClick={() => void copy(u, u)} className="text-slate-400 hover:text-sky-500">{copied === u ? <Check size={13} /> : <Copy size={13} />}</button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void copy(uuids.join('\n'), 'all')} className={btn}>
                  {copied === 'all' ? <Check size={13} /> : <Copy size={13} />} {t('Copy all')}
                </button>
                <ShareButton payload={() => ({ kind: 'text', text: uuids.join('\n') })} />
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className={box}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('Hex token')}</h3>
            <div className="mt-3 flex items-center gap-2">
              <input type="number" min={4} max={128} value={hexLen} onChange={(e) => setHexLen(Math.max(4, Math.min(128, +e.target.value || 4)))} className={input} />
              <button type="button" onClick={() => setHexOut(randHex(hexLen))} className={btn}><RefreshCw size={13} /></button>
            </div>
            {hexOut && (
              <button type="button" onClick={() => void copy(hexOut, 'hex')} title={t('Copy')}
                className="mt-2 w-full break-all rounded bg-slate-50 p-2 text-left font-mono text-[11px] text-slate-700 hover:bg-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800">
                {copied === 'hex' ? '✓ ' : ''}{hexOut}
              </button>
            )}
          </div>

          <div className={box}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('Random integer')}</h3>
            <div className="mt-3 flex items-center gap-2">
              <input value={lo} onChange={(e) => setLo(e.target.value)} className={input} />
              <span className="text-xs text-slate-500">{t('to')}</span>
              <input value={hi} onChange={(e) => setHi(e.target.value)} className={input} />
              <button type="button" className={btn} onClick={() => {
                const a = parseInt(lo, 10), b = parseInt(hi, 10)
                if (!isNaN(a) && !isNaN(b) && a <= b) setIntOut(a + randInt(b - a + 1))
              }}>
                <Dice5 size={13} /> {t('Roll')}
              </button>
            </div>
            {intOut !== null && <p className="mt-2 font-mono text-2xl font-bold text-sky-600 dark:text-sky-400">{intOut}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
