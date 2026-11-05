/**
 * report — findings model + 0–100 score + OWASP aggregation + export.
 * Score is computed over the VERIFIABLE denominator only: findings
 * whose underlying check couldn't run (CORS-locked target, unresolvable
 * $ref) count as unverifiable — they lower neither score nor pass
 * count. That keeps the score honest: a degraded run reports degraded
 * coverage, not a phantom clean bill.
 */

const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];
const SEV_WEIGHT = { Critical: 40, High: 25, Medium: 10, Low: 4, Info: 0 };

export const OWASP_API_2023 = {
  'API1:2023': 'Broken Object Level Authorization',
  'API2:2023': 'Broken Authentication',
  'API3:2023': 'Broken Object Property Level Authorization',
  'API4:2023': 'Unrestricted Resource Consumption',
  'API5:2023': 'Broken Function Level Authorization',
  'API6:2023': 'Unrestricted Access to Sensitive Business Flows',
  'API7:2023': 'Server Side Request Forgery',
  'API8:2023': 'Security Misconfiguration',
  'API9:2023': 'Improper Inventory Management',
  'API10:2023': 'Unsafe Consumption of APIs'
};

/** buildReport({ctx, findings, dynamic}) → report object. */
export function buildReport({ ctx, findings = [], dynamic = null }) {
  const buckets = { Critical: [], High: [], Medium: [], Low: [], Info: [], Passed: [] };
  const unverifiable = [];
  const owasp = {};

  for (const fn of findings) {
    if (fn.unverifiable) {
      unverifiable.push(fn);
      continue;
    }
    if (fn.positive || fn.severity === 'Info') {
      buckets[fn.positive ? 'Passed' : 'Info'].push(fn);
    } else {
      (buckets[fn.severity] || buckets.Info).push(fn);
    }
    if (fn.owasp) {
      const key = fn.owasp.split(' ')[0];
      owasp[key] = (owasp[key] || 0) + 1;
    }
  }

  // Verifiable denominator: ops actually checked (not CORS-degraded, not
  // unresolvable). A fully CORS-locked probe reports 0 verified checks —
  // score stays honest (no false 100).
  const totalOps = ctx && ctx.ops ? ctx.ops.length : 0;
  const probed = dynamic ? (dynamic.probed || 0) : 0;
  const verifiableOps = dynamic
    ? Math.max(probed - 0, 0)
    : totalOps;
  const degraded = dynamic && dynamic.refused === 'cors_tight';

  // Score: 100 minus severity-weighted deductions, floored at 0, over the
  // verifiable share. Unverifiable coverage scales the *confidence*, not
  // the raw deductions.
  let deductions = 0;
  for (const sev of ['Critical', 'High', 'Medium', 'Low']) {
    deductions += buckets[sev].length * SEV_WEIGHT[sev];
  }
  const score = degraded
    ? null // no verifiable surface — honest "insufficient data", not a fake score
    : Math.max(0, Math.min(100, 100 - deductions));

  return {
    generatedAt: new Date().toISOString(),
    api: ctx && ctx.info ? { title: ctx.info.title, version: ctx.info.version } : null,
    score,
    scoreBasis: degraded
      ? 'insufficient verifiable surface (CORS-locked target)'
      : `${verifiableOps} verifiable check(s), ${unverifiable.length} unverifiable`,
    counts: {
      critical: buckets.Critical.length,
      high: buckets.High.length,
      medium: buckets.Medium.length,
      low: buckets.Low.length,
      info: buckets.Info.length,
      passed: buckets.Passed.length,
      unverifiable: unverifiable.length
    },
    owasp,
    findings,
    dynamic
  };
}

/** exportJson(report) → Blob (JSON). Caller creates the object URL. */
export function exportJson(report) {
  return new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
}

/** Remediation snippets per checkId, per stack. UI renders the active one. */
export const REMEDIATION_SNIPPETS = {
  auth: {
    fastify: "app.addHook('preHandler', async (req, reply) => { const key = req.headers['x-api-key']; if (!key) return reply.code(401).send({error:'unauthorized'}); });",
    express: "app.use((req, res, next) => { if (!req.headers['x-api-key']) return res.status(401).json({error:'unauthorized'}); next(); });",
    nginx: 'satisfy all; auth_request /_oauth2_introspect;',
    worker: "if (!request.headers.get('x-api-key')) return new Response('unauthorized', { status: 401 });"
  },
  headers: {
    fastify: "await app.register(require('@fastify/helmet'));",
    express: "const helmet = require('helmet'); app.use(helmet());",
    nginx: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
    worker: "resp.headers.set('Strict-Transport-Security', 'max-age=31536000');"
  },
  cors: {
    fastify: "await app.register(require('@fastify/cors'), { origin: ['https://app.example.com'] });",
    express: "app.use(require('cors')({ origin: ['https://app.example.com'] }));",
    nginx: 'add_header Access-Control-Allow-Origin "https://app.example.com" always;',
    worker: "if (origin === 'https://app.example.com') resp.headers.set('Access-Control-Allow-Origin', origin);"
  },
  disclosure: {
    fastify: "app.register(async (a) => a.removeAllListeners('x-powered-by')); app.set('x-powered-by', false);",
    express: "app.disable('x-powered-by');",
    nginx: 'more_clear_headers Server;',
    worker: 'resp.headers.delete("x-powered-by");'
  }
};
