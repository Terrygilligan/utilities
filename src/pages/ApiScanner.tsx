import { useRef, useState } from 'react'
import { parseAndNormalize } from '../lib/scanner/parseSpec'
import { runStaticChecks } from '../lib/scanner/staticChecks'
import { runDynamicChecks } from '../lib/scanner/dynamicChecks'
import { buildReport, exportJson, OWASP_API_2023 } from '../lib/scanner/report'
import { SAMPLE_SPEC } from '../lib/scanner/sampleSpec'
import { FileUp } from 'lucide-react'
import FilePicker from '../components/FilePicker'
import Segmented from '../components/Segmented'
import { Field, cardCls, inputCls } from '../components/ui'
import { t } from '../utils/i18n'

const btn =
  'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-400'

type Finding = {
  checkId: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
  owasp: string | null
  endpoint: string | null
  title: string
  evidence: string
  remediation: string | null
  positive?: boolean
}
type Ctx = ReturnType<typeof parseAndNormalize>['ctx']
type Mode = 'paste' | 'upload' | 'url'

const SEV_CLS: Record<string, string> = {
  Critical: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Low: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  Info: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300'
}

export default function ApiScanner() {
  const [mode, setMode] = useState<Mode>('paste')
  const [text, setText] = useState('')
  const [specUrl, setSpecUrl] = useState('')
  const [error, setError] = useState('')
  const [ctx, setCtx] = useState<Ctx>(null)
  const [findings, setFindings] = useState<Finding[]>([])
  const [dynamic, setDynamic] = useState<any>(null)
  const [consent, setConsent] = useState(false)
  const [token, setToken] = useState('')
  const [probing, setProbing] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const scan = (source: string) => {
    setError('')
    const { ctx: c, diagnostics } = parseAndNormalize(source)
    if (!c) {
      setCtx(null)
      setFindings([])
      setError(diagnostics[0]?.message || t('Could not parse the spec.'))
      return
    }
    setCtx(c)
    setDynamic(null)
    setFindings(runStaticChecks(c) as Finding[])
  }

  const fetchUrl = async () => {
    setError('')
    try {
      const r = await fetch(specUrl, { credentials: 'omit' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      scan(await r.text())
    } catch (e: any) {
      setError(t('Could not fetch the spec URL ({msg}) — the API may be CORS-locked (paste the spec instead).', { msg: e.message }))
    }
  }

  const probe = async () => {
    if (!ctx || !consent) return
    setProbing(true)
    const dyn = await runDynamicChecks(ctx, { consent, token: token || undefined })
    setDynamic(dyn)
    setFindings((prev) => [...prev, ...(dyn.findings as Finding[])])
    setProbing(false)
  }

  const report = ctx ? buildReport({ ctx, findings, dynamic }) : null
  const grouped = ['Critical', 'High', 'Medium', 'Low', 'Info'].map((s) => ({
    sev: s,
    list: findings.filter((f) => !f.positive && f.severity === s)
  })).filter((g) => g.list.length)
  const passed = findings.filter((f) => f.positive)

  const download = () => {
    if (!report) return
    const url = URL.createObjectURL(exportJson(report))
    const a = document.createElement('a')
    a.href = url
    a.download = `api-scan-${(ctx!.info.title || 'report').replace(/\W+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold">{t('API Security Scanner')}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t('Paste an OpenAPI/Swagger spec (or fetch it) — findings are computed on your device. Nothing leaves this browser.')}
        </p>
      </header>

      <Segmented<Mode>
        value={mode}
        onChange={setMode}
        ariaLabel={t('Spec input method')}
        options={[
          { id: 'paste', label: t('Paste spec') },
          { id: 'upload', label: t('Upload file') },
          { id: 'url', label: t('Spec URL') }
        ]}
      />

      {mode === 'paste' && (
        <Field label={t('OpenAPI / Swagger document (JSON or YAML)')}>
          <textarea
            className={`${inputCls} h-40 font-mono text-xs`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder='{"openapi":"3.0.0", ...}'
          />
        </Field>
      )}
      {mode === 'upload' && (
        <Field label={t('Spec file')}>
          <FilePicker
            accept=".json,.yaml,.yml,.txt"
            title={t('Drop a spec file or click to browse')}
            subtitle={t('OpenAPI 3.x or Swagger 2.0 — JSON or YAML')}
            icon={FileUp}
            onFiles={async (files: File[]) => {
              const s = await files[0].text(); setText(s); scan(s)
            }}
          />
        </Field>
      )}
      {mode === 'url' && (
        <Field label={t('Spec URL (fetched directly by your browser)')}>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={specUrl}
              onChange={(e) => setSpecUrl(e.target.value)}
              placeholder="https://example.com/openapi.json"
            />
            <button className={btn} onClick={fetchUrl} disabled={!specUrl}>{t('Fetch')}</button>
          </div>
        </Field>
      )}

      <div className="flex flex-wrap gap-2">
        {mode === 'paste' && <button className={btn} onClick={() => scan(text)} disabled={!text.trim()}>{t('Scan')}</button>}
        <button className={btn} onClick={() => { setText(SAMPLE_SPEC); scan(SAMPLE_SPEC) }}>{t('Try a sample spec')}</button>
      </div>
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {ctx && (
        <div className={cardCls}>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>{t('I own or am authorized to test this API — enable a small live probe (HTTPS only, ≤2 requests per endpoint, nothing proxied).')}</span>
          </label>
          {consent && (
            <div className="mt-2 flex gap-2">
              <input className={inputCls} value={token} onChange={(e) => setToken(e.target.value)}
                placeholder={t('Optional bearer token (memory only)')} type="password" />
              <button className={btn} onClick={probe} disabled={probing}>
                {probing ? t('Probing…') : t('Run live probe')}
              </button>
            </div>
          )}
        </div>
      )}

      {report && (
        <div ref={reportRef} className="space-y-4 print-area">
          <div className={cardCls}>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm text-slate-500">{ctx!.info.title || t('Untitled API')} {ctx!.info.version && `v${ctx!.info.version}`}</div>
                <div className="mt-1 text-3xl font-bold">
                  {report.score === null ? '—' : report.score}<span className="text-sm font-normal text-slate-500">/100</span>
                </div>
                <div className="text-xs text-slate-500">{report.scoreBasis}</div>
              </div>
              <div className="flex gap-2">
                <button className={btn} onClick={download}>{t('Export JSON')}</button>
                <button className={btn} onClick={() => window.print()}>{t('Print / PDF')}</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {Object.entries(report.counts).filter(([, v]) => (v as number) > 0).map(([k, v]) => (
                <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">{k}: {v as number}</span>
              ))}
            </div>
          </div>

          {grouped.map((g) => (
            <div key={g.sev} className={cardCls}>
              <h2 className="font-semibold">{g.sev} ({g.list.length})</h2>
              <ul className="mt-2 space-y-3">
                {g.list.map((fn, i) => (
                  <li key={i} className="border-t border-slate-200 pt-2 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${SEV_CLS[fn.severity]}`}>{fn.severity}</span>
                      <span className="font-medium">{fn.title}</span>
                      {fn.owasp && <span className="text-xs text-slate-500">{fn.owasp}</span>}
                    </div>
                    {fn.endpoint && <div className="mt-1 font-mono text-xs text-slate-500">{fn.endpoint}</div>}
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{fn.evidence}</p>
                    {fn.remediation && <p className="mt-1 text-sm"><span className="font-medium">{t('Fix:')}</span> {fn.remediation}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {passed.length > 0 && (
            <div className={cardCls}>
              <h2 className="font-semibold">{t('Passed')} ({passed.length})</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {passed.map((fn, i) => <li key={i}>✓ {fn.title}{fn.evidence ? ` — ${fn.evidence}` : ''}</li>)}
              </ul>
            </div>
          )}

          {Object.keys(report.owasp).length > 0 && (
            <div className={cardCls}>
              <h2 className="font-semibold">{t('OWASP API Security Top 10 (2023)')}</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(report.owasp).map(([k, n]) => (
                  <li key={k}><span className="font-mono text-xs">{k}</span> {(OWASP_API_2023 as any)[k] || ''} — {n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={`${cardCls} text-sm`}>
        {t('Need continuous multi-node compliance audits for your API surface?')}
        {' '}
        <a href="https://compliance-audit.eu" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline dark:text-sky-400">
          compliance-audit.eu
        </a>
      </div>
    </div>
  )
}
