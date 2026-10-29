import { useCallback, useMemo, useState } from 'react'
import { Check, Copy, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import ShareButton from '../components/ShareButton'
import { t } from '../utils/i18n'

const WORDLIST = [
  'apple','arrow','baker','beach','berry','birch','bloom','brave','brick','brook',
  'cabin','candy','cedar','charm','cliff','cloud','clover','coast','comet','coral',
  'crane','creek','crown','daisy','dance','delta','diver','drift','eagle','ember',
  'fable','falcon','frost','flint','forge','fox','frost','garden','glade','globe',
  'grain','grape','grove','harbor','hazel','heron','honey','horse','island','ivory',
  'jade','jewel','jolly','jungle','kayak','kernel','kite','koala','lance','lark',
  'lemon','lily','lodge','lotus','lunar','mango','maple','meadow','merit','miner',
  'mint','moose','moss','noble','north','oasis','ocean','olive','onyx','orbit',
  'otter','panda','pearl','pepper','petal','pilot','pine','plaza','plume','prism',
  'quail','quartz','quest','quiet','radar','raven','reef','ridge','river','robin',
  'rocket','sage','sail','scarlet','scout','shadow','shore','sierra','silver','sky',
  'slate','solar','sparrow','spirit','spring','stable','star','stone','storm','summit',
  'swift','tango','temple','tide','tiger','timber','topaz','trail','tulip','umber',
  'unity','valley','vapor','velvet','violet','viper','vista','voyage','walnut','wander',
  'water','weaver','whale','willow','wind','winter','wolf','wren','yellow','yonder',
  'zephyr','zigzag','anchor','basket','beacon','butter','candle','castle','circus',
  'cobalt','copper','crystal','dagger','desert','dolphin','dragon','dune','fable',
  'feather','flag','flame','forest','fountain','galaxy','ginger','hammer','helmet',
  'horizon','iceberg','jacket','jaguar','jungle','lantern','magnet','marble','meteor',
  'mirror','mustard','nectar','nickel','northern','orchid','otter','palace','parrot',
  'pebble','phoenix','pirate','planet','prairie','quiver','ribbon','saddle','saffron',
  'salmon','scepter','shadow','shelter','spider','spruce','sunset','thunder','tornado',
  'trident','tundra','turkey','uranus','velvet','violin','volcano','wagon','walrus',
  'whiskey','window','winter','wizard','yellow','zebra','zenith',
]

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/~'

type Mode = 'passphrase' | 'password'
type Separator = '-' | '.' | ' ' | ''

const SEPARATORS: { value: Separator; label: string }[] = [
  { value: '-', label: 'hyphens' },
  { value: '.', label: 'dots' },
  { value: ' ', label: 'spaces' },
  { value: '', label: 'none' },
]

function secureIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    if (buf[0] < limit) return buf[0] % max
  }
}



export default function PasswordGenerator() {
  const [mode, setMode] = useState<Mode>('password')
  const [length, setLength] = useState(20)
  const [wordCount, setWordCount] = useState(5)
  const [separator, setSeparator] = useState<Separator>('-')
  const [capitalize, setCapitalize] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useDigits, setUseDigits] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const charset = useMemo(
    () =>
      (useLower ? LOWER : '') +
      (useUpper ? UPPER : '') +
      (useDigits ? DIGITS : '') +
      (useSymbols ? SYMBOLS : ''),
    [useLower, useUpper, useDigits, useSymbols],
  )

  const entropy = useMemo(() => {
    if (!output) return 0
    return mode === 'passphrase'
      ? wordCount * Math.log2(WORDLIST.length)
      : length * Math.log2(charset.length || 1)
  }, [output, mode, wordCount, length, charset.length])

  const strength = useMemo(() => {
    if (entropy < 45) return { label: 'Weak', pct: Math.min(30, entropy), cls: 'bg-red-400' }
    if (entropy < 65) return { label: 'Fair', pct: 55, cls: 'bg-amber-400' }
    if (entropy < 85) return { label: 'Good', pct: 75, cls: 'bg-sky-400' }
    return { label: 'Excellent', pct: 100, cls: 'bg-emerald-400' }
  }, [entropy])

  const generate = useCallback(() => {
    setError(null)
    setCopied(false)
    if (mode === 'passphrase') {
      const words = Array.from({ length: wordCount }, () => {
        const w = WORDLIST[secureIndex(WORDLIST.length)]
        return capitalize ? w[0].toUpperCase() + w.slice(1) : w
      })
      setOutput(words.join(separator))
      return
    }
    if (!charset.length) {
      setError(t('Enable at least one character class.'))
      setOutput('')
      return
    }
    let result = ''
    const bytes = new Uint32Array(length)
    crypto.getRandomValues(bytes)
    const limit = Math.floor(0x100000000 / charset.length) * charset.length
    let i = 0
    while (result.length < length) {
      const v = bytes[i]
      i++
      if (i >= bytes.length) {
        crypto.getRandomValues(bytes)
        i = 0
      }
      if (v < limit) result += charset[v % charset.length]
    }
    setOutput(result)
  }, [mode, wordCount, capitalize, separator, length, charset])

  const copy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('Copy failed — select the text manually.'))
    }
  }, [output])

  const toggleCls = (on: boolean) =>
    `relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`
  const knobCls = (on: boolean) =>
    `absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? 'translate-x-[22px]' : ''}`

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('Passphrase & Password Generator')}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        {t('Cryptographically random via')} <code className="rounded bg-slate-200 dark:bg-slate-800 px-1">crypto.getRandomValues()</code>.{' '}
        {t('Generated entirely on-device — nothing is logged, stored, or sent.')}
      </p>

      <div
        role="tablist"
        aria-label={t('Generator mode')}
        className="mt-6 flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1"
      >
        {(
          [
            { id: 'password' as Mode, label: 'Complex password' },
            { id: 'passphrase' as Mode, label: 'Memorable passphrase' },
          ]
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition sm:text-sm ${
              mode === id ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        {mode === 'password' ? (
          <>
            <div>
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="len" className="font-medium text-slate-700 dark:text-slate-300">{t('Length')}</label>
                <span className="tabular-nums text-sky-600 dark:text-sky-400">{length}</span>
              </div>
              <input
                id="len"
                type="range"
                min={12}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="mt-2 w-full accent-sky-400"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>12</span><span>64</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ['ABC', useUpper, setUseUpper],
                  ['abc', useLower, setUseLower],
                  ['123', useDigits, setUseDigits],
                  ['#$&', useSymbols, setUseSymbols],
                ] as const
              ).map(([label, on, set]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set(!on)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800"
                  aria-pressed={on}
                >
                  <span className={toggleCls(on)}>
                    <span className={knobCls(on)} />
                  </span>
                  <span className="font-mono text-xs">{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="wc" className="font-medium text-slate-700 dark:text-slate-300">{t('Words')}</label>
                <span className="tabular-nums text-sky-600 dark:text-sky-400">{wordCount}</span>
              </div>
              <input
                id="wc"
                type="range"
                min={4}
                max={10}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="mt-2 w-full accent-sky-400"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>4</span><span>10</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                {t('Separator')}
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value as Separator)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  {SEPARATORS.map(({ value, label }) => (
                    <option key={label} value={value}>
                      {t(label)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setCapitalize(!capitalize)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800"
                aria-pressed={capitalize}
              >
                <span className={toggleCls(capitalize)}>
                  <span className={knobCls(capitalize)} />
                </span>
                {t('Capitalize words')}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 break-all rounded-xl bg-slate-100 dark:bg-slate-950/60 p-4 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100">
            {output || <span className="text-slate-500">{t('Press generate…')}</span>}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generate}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/25"
          >
            <RefreshCw size={16} />
            {t('Generate')}
          </button>
          <button
            type="button"
            onClick={copy}
            disabled={!output}
            className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? <Check size={16} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={16} />}
            {copied ? t('Copied!') : t('Copy')}
          </button>
          <ShareButton
            disabled={!output}
            payload={() =>
              output
                ? { kind: 'text', text: output, title: t('Generated password') }
                : null
            }
          />
          {output && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-sky-600 dark:text-sky-400" />
              {t('{bits} bits', { bits: entropy.toFixed(0) })}
            </span>
          )}
        </div>
        {output && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{t('Strength: {level}', { level: t(strength.label) })}</span>
              <span>{t('{bits} bits of entropy', { bits: entropy.toFixed(0) })}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${strength.cls}`}
                style={{ width: `${strength.pct}%` }}
              />
            </div>
          </div>
        )}
        {error && (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
            <TriangleAlert size={15} /> {error}
          </p>
        )}
      </div>
    </div>
  )
}
