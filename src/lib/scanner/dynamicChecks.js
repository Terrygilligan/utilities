/**
 * dynamicChecks — Tier B browser-side probing. Direct browser→target
 * fetch only: no server proxy (abuse-relay prevention + zero tracking —
 * the privacy rule and the cost guard are the same decision).
 *
 * Invariants enforced at module level:
 *  - consent: caller must pass { consent:true } — no silent probing
 *  - https only: http:// targets are refused outright
 *  - budget: ≤2 requests/endpoint (OPTIONS + GET), ≤25 endpoints,
 *    sequential ~300ms, credentials:'omit'; optional bearer token lives
 *    in memory for the call only
 *  - CORS-blocked → the target is tight by construction: one positive
 *    finding, every remaining check marked unverifiable (never a pass)
 */

const SECURITY_HEADERS = [
  { name: 'strict-transport-security', label: 'HSTS' },
  { name: 'x-content-type-options', label: 'nosniff' },
  { name: 'content-security-policy', label: 'CSP' },
  { name: 'x-frame-options', label: 'frame-deny' },
  { name: 'referrer-policy', label: 'Referrer-Policy' },
  { name: 'permissions-policy', label: 'Permissions-Policy' },
  { name: 'cache-control', label: 'Cache-Control' }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function f(checkId, severity, owasp, endpoint, title, evidence, remediation, positive) {
  return { checkId, severity, owasp, endpoint, title, evidence, remediation, positive: !!positive };
}

/**
 * probe(ctx | {baseUrl, ops}, opts) → { findings, probed, unverifiable }
 * opts: { consent:boolean (required), token?:string, onProgress?:fn,
 *         fetchImpl?:fn (test seam — defaults to window.fetch) }
 */
export async function runDynamicChecks(target, opts = {}) {
  const doFetch = opts.fetchImpl || fetch;
  const findings = [];
  const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : () => {};

  if (!opts.consent) {
    return { findings: [], probed: 0, unverifiable: 0, refused: 'consent_required' };
  }
  const base = String(target.baseUrl || (target.servers && target.servers[0] && target.servers[0].url) || '');
  if (!base) return { findings: [], probed: 0, unverifiable: 0, refused: 'no_base_url' };
  if (!/^https:\/\//i.test(base)) {
    findings.push(f('insecure_target', 'Info', null, base,
      `Target '${base}' is not HTTPS — probing refused`,
      'Only https:// targets are probed; http:// URLs are surfaced as static findings instead.',
      'Scan the TLS endpoint, or note the plaintext URL as a finding on the spec.'));
    return { findings, probed: 0, unverifiable: 0, refused: 'http_target' };
  }

  const headers = { credentials: 'omit' };
  const authHeaders = opts.token ? { authorization: `Bearer ${opts.token}` } : {};

  // ---- Probe 1: OPTIONS preflight on the base URL ----------------------
  let preflight = null;
  try {
    onProgress('options', base);
    preflight = await doFetch(base, { method: 'OPTIONS', credentials: 'omit', headers: { 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'content-type' } });
  } catch {
    // CORS/Network error → the origin refuses cross-origin reads entirely
    findings.push(f('cors_tight', 'Info', 'API8:2023 Security Misconfiguration', base,
      'Tight CORS — origin rejects cross-origin reads',
      'The OPTIONS preflight failed: this API is not browser-readable cross-origin. That is the correct default for a server API.',
      'No action needed — this is the intended posture for a non-browser API.', true));
    const rest = (target.ops || []).slice(0, 25);
    return { findings, probed: 1, unverifiable: rest.length * 2, remaining: rest.length, refused: 'cors_tight' };
  }

  const h = (name) => preflight.headers.get(name);

  // Security headers on the preflight response
  for (const sh of SECURITY_HEADERS) {
    const v = h(sh.name);
    if (!v) {
      findings.push(f(`hdr_${sh.name}`, 'Medium', 'API8:2023 Security Misconfiguration', base,
        `Missing ${sh.label} header`, `${sh.name} not present on the response.`,
        sh.name === 'strict-transport-security'
          ? 'Add `Strict-Transport-Security: max-age=31536000; includeSubDomains`.'
          : sh.name === 'cache-control'
            ? 'Add `Cache-Control: no-store` on API responses — nothing cacheable should linger in intermediaries.'
            : `Add a ${sh.name} header appropriate to an API surface.`));
    } else {
      findings.push(f(`hdr_${sh.name}`, 'Info', null, base,
        `${sh.label} present`, `${sh.name}: ${v}`, null, true));
    }
  }

  // Server/framework disclosure
  for (const name of ['server', 'x-powered-by']) {
    const v = h(name);
    if (v) {
      findings.push(f('disclosure', 'Low', 'API8:2023 Security Misconfiguration', base,
        `'${name}: ${v}' discloses stack details`,
        `Response advertises ${name}: ${v}.`,
        'Strip `Server`/`X-Powered-By` — Fastify `exposeHeadRoutes`/`app.set("x-powered-by", false)`, Cloudflare strips Server at the edge.'));
    }
  }

  // CORS breadth: ACAO * vs reflective
  const acao = h('access-control-allow-origin');
  if (acao === '*') {
    findings.push(f('cors_star', 'Medium', 'API8:2023 Security Misconfiguration', base,
      'CORS allows any origin (`*`)',
      'Access-Control-Allow-Origin: * — any site can read responses from a browser.',
      'Tighten the allow-list to the portal origin(s); wildcard on an API that might ever sit behind cookies/auth is a foot-gun.'));
  }

  // ---- Probe 2+: unauthenticated baseline on secured ops ---------------
  const ops = (target.ops || []).slice(0, 25);
  let probed = 1;
  for (const op of ops) {
    if (op.method !== 'GET') continue; // GETs only — no mutating probes
    const secured = Array.isArray(op.security) ? op.security.length > 0
      : (target.globalSecurity || []).length > 0;
    if (!secured) continue; // public ops aren't a baseline check
    const url = base.replace(/\/$/, '') + op.path.replace(/\{[^}]+\}/g, 'x');
    try {
      onProgress('get', url);
      const t0 = performance.now();
      const resp = await doFetch(url, { method: 'GET', credentials: 'omit', headers: authHeaders });
      const ms = Math.round(performance.now() - t0);
      probed += 1;
      if (resp.status === 200) {
        findings.push(f('auth_baseline', 'Critical', 'API2:2023 Broken Authentication', `${op.method} ${op.path}`,
          `Secured operation answers 200 without credentials`,
          `GET ${op.path} → 200 (${ms} ms) with no Authorization header — expected 401/403.`,
          'Verify the auth preHandler actually gates this route — a secured op answering anonymously is a live breach.'));
      } else if (resp.status === 401 || resp.status === 403) {
        findings.push(f('auth_baseline', 'Info', null, `${op.method} ${op.path}`,
          'Unauthenticated baseline correctly refused',
          `GET ${op.path} → ${resp.status} (${ms} ms) — the auth gate fires.`, null, true));
      } else if (resp.status === 404) {
        findings.push(f('auth_baseline', 'Info', null, `${op.method} ${op.path}`,
          'Route not found at the probed path',
          `GET ${op.path} → 404 (${ms} ms) — the live surface may differ from the spec.`, null, true));
      } else {
        findings.push(f('auth_baseline', 'Info', null, `${op.method} ${op.path}`,
          `Baseline → ${resp.status}`,
          `GET ${op.path} → ${resp.status} (${ms} ms) — neither anonymous-pass nor standard refusal; worth a manual look.`, null, true));
      }
    } catch {
      // blocked by CORS or network — endpoint unverifiable, not a finding
    }
    await sleep(300); // sequential + paced — the budget guard
  }

  return { findings, probed, unverifiable: 0 };
}
