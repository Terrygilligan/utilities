import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { t } from '../utils/i18n'

interface Entry { id: string; label: string; secret: string }

const b32 = (s: string): Uint8Array | null => {
  const clean = s.toUpperCase().replace(/[\s=]/g, '')
  if (!/^[A-Z2-7]+$/.test(clean)) return null
  let bits = 0, val = 0
  const out: number[] = []
  for (const c of clean) {
    val = (val << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c)
    bits += 5
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8 }
  }
  return new Uint8Array(out)
}

async function hotp(secret: Uint8Array, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', secret as BufferSource, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const msg = new DataView(new ArrayBuffer(8))
  msg.setUint32(4, counter)
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg))
  const off = sig[19] & 0xf
  const code = ((sig[off] & 0x7f) << 24 | sig[off + 1] << 16 | sig[off + 2] << 8 | sig[off + 3]) % 1e6
  return String(code).padStart(6, '0')
}

const parseOtpauth = (uri: string): { label: string; secret: string } | null => {
  try {
    const u = new URL(uri)
    if (u.protocol !== 'otpauth:' || !u.hostname.startsWith('totp')) return null
    const secret = u.searchParams.get('secret')
    if (!secret) return null
    const label = decodeURIComponent(u.pathname.slice(1)) || u.searchParams.get('issuer') || t('Account')
    return { label, secret }
  } catch { return null }
}

const KEY = 'utility-hub.totp'

export default function TotpAuthenticator() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [left, setLeft] = useState(30)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const tick = useRef(0)

  useEffect(() => {
    const run = async () => {
      const counter = Math.floor(Date.now() / 30000)
      setLeft(30 - (Math.floor(Date.now() / 1000) % 30))
      const out: Record<string, string> = {}
      for (const e of entries) {
        const bytes = b32(e.secret)
        out[e.id] = bytes ? await hotp(bytes, counter) : t('invalid')
      }
      setCodes(out)
    }
    void run()
    tick.current = window.setInterval(() => void run(), 1000)
    return () => clearInterval(tick.current)
  }, [entries])

  const persist = (list: Entry[]) => { setEntries(list); localStorage.setItem(KEY, JSON.stringify(list)) }

  const add = () => {
    setError('')
    const parsed = parseOtpauth(input)
    if (parsed) {
      if (!b32(parsed.secret)) return setError(t('Secret in that URI is not valid Base32.'))
      persist([...entries, { id: crypto.randomUUID(), ...parsed }])
      return setInput('')
    }
    if (!b32(input)) return setError(t('Paste an otpauth:// URI or a Base32 secret (A–Z, 2–7).'))
    persist([...entries, { id: crypto.randomUUID(), label: t('Manual entry'), secret: input.replace(/\s/g, '') }])
    setInput('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('TOTP Authenticator')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Generate 2FA codes from an')} <code>otpauth://</code> {t('URI or Base32 secret — computed locally, stored only in this browser.')}
      </p>

      <div className="mt-6 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
          placeholder="otpauth://totp/… or JBSWY3DPEHPK3PXP"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-950/60" />
        <button type="button" onClick={add} disabled={!input}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:opacity-40 dark:text-sky-400">
          <Plus size={15} /> {t('Add')}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {entries.length > 0 && (
        <ul className="mt-5 space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.label}</p>
                <p className="font-mono text-[10px] text-slate-500">{e.secret.slice(0, 8)}…</p>
              </div>
              <button type="button" title={t('Copy code')}
                onClick={async () => { await navigator.clipboard.writeText(codes[e.id] ?? ''); setCopied(e.id); setTimeout(() => setCopied(''), 1200) }}
                className="flex items-center gap-2 rounded-lg px-2 py-1 font-mono text-2xl font-bold tabular-nums tracking-wider text-sky-600 transition hover:bg-sky-500/10 dark:text-sky-400">
                {codes[e.id] ?? '…'}
                {copied === e.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
              </button>
              <span className="w-8 text-right font-mono text-xs text-slate-500">{left}s</span>
              <button type="button" onClick={() => persist(entries.filter((x) => x.id !== e.id))}
                className="text-slate-400 transition hover:text-red-500"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" />
        {t('Secrets never leave this device — but browser storage isn\'t a vault. For high-value accounts a dedicated authenticator app is the stronger choice.')}
      </p>
    </div>
  )
}
