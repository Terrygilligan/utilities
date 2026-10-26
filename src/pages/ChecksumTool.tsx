import { useCallback, useState } from 'react'
import { Check, Copy, FileCheck2, Loader2, TriangleAlert } from 'lucide-react'
import FilePicker from '../components/FilePicker'

// Minimal MD5 — WebCrypto has no MD5.
function md5(buf: ArrayBuffer): string {
  const input = new Uint8Array(buf)
  const origLen = input.length
  const bitLen = origLen * 8
  const pad = ((origLen % 64) < 56 ? 56 : 120) - (origLen % 64) + 8
  const msg = new Uint8Array(origLen + pad)
  msg.set(input)
  msg[origLen] = 0x80
  const dv = new DataView(msg.buffer)
  dv.setUint32(origLen + pad - 8, bitLen >>> 0, true)
  dv.setUint32(origLen + pad - 4, Math.floor(bitLen / 0x100000000), true)
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21]
  const K = [...Array(64)].map((_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000))
  const rol = (x: number, n: number) => (x << n) | (x >>> (32 - n))
  for (let off = 0; off < msg.length; off += 64) {
    const M = [...Array(16)].map((_, i) => dv.getUint32(off + i * 4, true))
    let a = a0, b = b0, c = c0, d = d0
    for (let i = 0; i < 64; i++) {
      let f: number, g: number
      if (i < 16) { f = (b & c) | (~b & d); g = i }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16 }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16 }
      else { f = c ^ (b | ~d); g = (7 * i) % 16 }
      const tmp = d; d = c; c = b
      b = (b + rol((a + f + K[i] + M[g]) | 0, S[i])) | 0
      a = tmp
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0
  }
  const hex = (n: number) => [0, 8, 16, 24].map((s) => ((n >>> s) & 255).toString(16).padStart(2, '0')).join('')
  return hex(a0) + hex(b0) + hex(c0) + hex(d0)
}

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export default function ChecksumTool() {
  const [file, setFile] = useState<File | null>(null)
  const [hashes, setHashes] = useState<Record<string, string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [expected, setExpected] = useState('')
  const [copied, setCopied] = useState('')

  const compute = useCallback(async (f: File) => {
    setFile(f)
    setHashes(null)
    setBusy(true)
    const buf = await f.arrayBuffer()
    const [sha256, sha1] = await Promise.all([
      crypto.subtle.digest('SHA-256', buf).then(toHex),
      crypto.subtle.digest('SHA-1', buf).then(toHex),
    ])
    setHashes({ 'SHA-256': sha256, 'SHA-1': sha1, MD5: md5(buf) })
    setBusy(false)
  }, [])

  const norm = expected.trim().toLowerCase()
  const match = norm && hashes ? Object.values(hashes).includes(norm) : null

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Checksum Calculator</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Verify file integrity locally — SHA-256, SHA-1, and MD5 computed in-memory. Files never upload.
      </p>

      <div className="mt-6">
        <FilePicker
          accept="*/*"
          title="Drop any file to hash it"
          subtitle="Read into memory, hashed, discarded — nothing leaves the browser"
          icon={FileCheck2}
          onFiles={(files) => files[0] && void compute(files[0])}
        />
      </div>

      {busy && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 size={15} className="animate-spin" /> Hashing {file?.name}…
        </p>
      )}

      {hashes && file && (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium">{file.name} <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span></p>
          {Object.entries(hashes).map(([name, hash]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-semibold text-slate-500">{name}</span>
              <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-100 px-2 py-1.5 font-mono text-xs dark:bg-slate-950/60">{hash}</code>
              <button type="button" aria-label={`Copy ${name}`}
                onClick={async () => { await navigator.clipboard.writeText(hash); setCopied(name); setTimeout(() => setCopied(''), 1200) }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
                {copied === name ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          ))}
          <label className="block pt-2 text-sm">
            <span className="text-xs text-slate-500">Compare against expected hash</span>
            <input value={expected} onChange={(e) => setExpected(e.target.value)} spellCheck={false}
              placeholder="Paste the hash you were given…"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950/60" />
          </label>
          {match !== null && (
            <p className={`flex items-center gap-2 text-sm font-medium ${match ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {match ? <Check size={15} /> : <TriangleAlert size={15} />}
              {match ? 'Match — file is intact.' : 'No match — file differs from the expected hash.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
