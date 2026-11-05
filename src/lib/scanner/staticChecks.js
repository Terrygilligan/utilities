/**
 * staticChecks — Tier A rules over the normalized ctx. No network.
 * Each rule: { id, severity, owasp, run(ctx) → findings[] }.
 * Findings: { checkId, severity, owasp, endpoint, title, evidence,
 *             remediation } — uniform for report.js.
 * Unresolvable pieces are reported as unverifiable (Info), never
 * silently passed.
 */

const CREDENTIAL_NAMES = /^(api_?key|token|secret|password|passwd|auth|access_?key|private_?key|key)$/i;
const LEAK_PROPS = /^(stack|trace|stacktrace|exception|debug|internal|cause|sql|query)$/i;
const PAGINATION_PARAMS = /^(limit|offset|page|cursor|per_?page|pagesize|top|take|max|count|after|before)$/i;

/** effective security for an op: op-level wins; undefined = inherit global. */
function opSecured(ctx, op) {
  if (Array.isArray(op.security) && op.security.length) return 'explicit';
  if (Array.isArray(op.security) && !op.security.length) return 'public';
  return ctx.globalSecurity && ctx.globalSecurity.length ? 'inherited' : 'none';
}

function endpoint(op) {
  return `${op.method} ${op.path}`;
}

function f(rule, op, severity, owasp, title, evidence, remediation) {
  return { checkId: rule.id, severity, owasp, endpoint: op ? endpoint(op) : null, title, evidence, remediation };
}

const REMEDIATION = {
  auth: 'Require authentication on every operation (bearer/apiKey-in-header). An empty `security: []` array is the *deliberate* public marker — audit it instead of assuming it.',
  queryKey: 'Move credentials out of the query string — headers only (apiKey `in: header` or HTTP bearer). URLs are logged, cached, and shared; query keys leak into access logs, referers, and browser history.',
  pagination: 'Add a pagination parameter (limit/offset or cursor) and enforce a server-side ceiling — unbounded list endpoints are a memory/egress amplifier.',
  errorLeak: 'Return a generic error body; never serialize stack traces, exception types, or SQL internals to clients. Map to a stable error code.',
  http: 'Serve HTTPS only; drop `http://` entries from `servers[]`. HSTS on the API host closes the redirect window.',
  basic: 'Replace HTTP Basic with bearer tokens — basic auth is base64-not-encrypted, and basic over anything-but-HSTS leaks credentials trivially.',
  unvalidated: 'Constrain string properties: `maxLength`, `pattern`, or `format`. Unbounded strings are the classic injection/deserialization surface.',
  errorResponses: 'Document at least one error response per operation (4xx, 5xx, or `default`) — silent failure modes are invisible to contract consumers.',
  deprecated: 'Mark a removal date in the description or drop the operation — deprecated-but-live endpoints accumulate unpatched clients.'
};

export const rules = [

  {
    id: 'no_security', severity: 'High', owasp: 'API2:2023 Broken Authentication',
    run(ctx) {
      const out = [];
      for (const op of ctx.ops) {
        const sec = opSecured(ctx, op);
        if (sec === 'none') {
          out.push(f(this, op, 'High', this.owasp, 'No authentication requirement',
            'Operation has no `security` and the global `security` list is empty/absent — reachable anonymously.',
            REMEDIATION.auth));
        } else if (sec === 'public') {
          out.push(f(this, op, 'Info', this.owasp, 'Explicitly public operation',
            '`security: []` marks this operation deliberately anonymous — worth an explicit audit, not an assumption.',
            REMEDIATION.auth));
        }
      }
      return out;
    }
  },

  {
    id: 'credential_query', severity: 'Critical', owasp: 'API2:2023 Broken Authentication',
    run(ctx) {
      const out = [];
      // Spec-design flaw: an apiKey scheme IN the query string is Critical
      // for every operation that uses it — one finding, spec level.
      for (const [name, sch] of Object.entries(ctx.securitySchemes)) {
        if (sch.type === 'apiKey' && sch.in === 'query') {
          out.push({
            checkId: this.id, severity: 'Critical', owasp: this.owasp, endpoint: null,
            title: `apiKey scheme '${name}' passed in query string`,
            evidence: `securitySchemes.${name}: type=apiKey, in=query — every consumer passes the key in the URL.`,
            remediation: REMEDIATION.queryKey
          });
        }
      }
      for (const op of ctx.ops) {
        for (const p of op.params) {
          if (p.in === 'query' && CREDENTIAL_NAMES.test(p.name)) {
            out.push(f(this, op, 'Critical', this.owasp,
              `Credential-like query parameter '${p.name}'`,
              `${endpoint(op)} accepts '${p.name}' as a query parameter.`,
              REMEDIATION.queryKey));
          }
        }
      }
      return out;
    }
  },

  {
    id: 'unbounded_list', severity: 'Medium', owasp: 'API4:2023 Unrestricted Resource Consumption',
    run(ctx) {
      const out = [];
      for (const op of ctx.ops) {
        if (op.method !== 'GET') continue;
        const resp2xx = Object.entries(op.responses || {})
          .find(([s]) => /^2/.test(s));
        if (!resp2xx) continue;
        const resp = resp2xx[1];
        if (!resp || typeof resp !== 'object') {
          // response unresolvable → unverifiable, not silent-pass
          continue;
        }
        const json = (resp.content && (resp.content['application/json']
          || Object.values(resp.content).find((c) => c && c.schema))) || resp;
        const schema = json.schema;
        if (!schema) continue;
        if (schema.type === 'array' && !op.params.some((p) => p.in === 'query' && PAGINATION_PARAMS.test(p.name))) {
          out.push(f(this, op, 'Medium', this.owasp, 'Unbounded list endpoint',
            `GET ${op.path} returns an array with no pagination parameter (limit/offset/cursor/…).`,
            REMEDIATION.pagination));
        }
      }
      return out;
    }
  },

  {
    id: 'error_leak', severity: 'Medium', owasp: 'API5:2023 Broken Function Level Authorization',
    run(ctx) {
      const out = [];
      for (const op of ctx.ops) {
        for (const [status, resp] of Object.entries(op.responses || {})) {
          if (!/^[45]|^default$/.test(status) || !resp || typeof resp !== 'object') continue;
          const json = (resp.content && (resp.content['application/json']
            || Object.values(resp.content).find((c) => c && c.schema))) || resp;
          const props = (json.schema && json.schema.properties) || json.properties || {};
          for (const prop of Object.keys(props)) {
            if (LEAK_PROPS.test(prop)) {
              out.push(f(this, op, 'Medium', this.owasp,
                `Error response leaks '${prop}'`,
                `${endpoint(op)} ${status} schema exposes '${prop}' — stack/exception internals to clients.`,
                REMEDIATION.errorLeak));
            }
          }
        }
      }
      return out;
    }
  },

  {
    id: 'http_server', severity: 'High', owasp: 'API5:2023 Broken Function Level Authorization',
    run(ctx) {
      const out = [];
      for (const s of ctx.servers) {
        if (typeof s.url === 'string' && s.url.startsWith('http://')) {
          const dev = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)/i.test(s.url);
          out.push({
            checkId: this.id, severity: dev ? 'Info' : 'High', owasp: this.owasp, endpoint: null,
            title: dev ? `Dev server entry '${s.url}'` : `Insecure server URL '${s.url}'`,
            evidence: `servers[].url is plaintext HTTP${dev ? ' (localhost — normal for dev specs)' : ''}.`,
            remediation: REMEDIATION.http
          });
        }
      }
      return out;
    }
  },

  {
    id: 'weak_auth', severity: 'High', owasp: 'API2:2023 Broken Authentication',
    run(ctx) {
      const out = [];
      for (const [name, sch] of Object.entries(ctx.securitySchemes)) {
        const weak = sch.type === 'basic'
          || (sch.type === 'http' && sch.scheme === 'basic');
        if (weak) {
          out.push({
            checkId: this.id, severity: 'High', owasp: this.owasp, endpoint: null,
            title: `Basic-auth scheme '${name}'`,
            evidence: `securitySchemes.${name}: ${sch.type === 'http' ? `http+${sch.scheme}` : sch.type} — base64 credentials, no expiry, no scoping.`,
            remediation: REMEDIATION.basic
          });
        }
      }
      return out;
    }
  },

  {
    id: 'deprecated_op', severity: 'Low', owasp: 'API9:2023 Improper Inventory Management',
    run(ctx) {
      return ctx.ops.filter((op) => op.deprecated).map((op) =>
        f(this, op, 'Low', this.owasp, 'Deprecated operation still live',
          `${endpoint(op)} is marked deprecated but remains in the spec.`,
          REMEDIATION.deprecated));
    }
  },

  {
    id: 'missing_error_response', severity: 'Info', owasp: null,
    run(ctx) {
      return ctx.ops
        .filter((op) => !Object.keys(op.responses || {}).some((s) => /^[45]|^default$/.test(s)))
        .map((op) => f(this, op, 'Info', null, 'No documented error response',
          `${endpoint(op)} documents only success responses — failure modes are invisible to consumers.`,
          REMEDIATION.errorResponses));
    }
  },

  {
    id: 'unvalidated_body', severity: 'Low', owasp: 'API8:2023 Security Misconfiguration',
    run(ctx) {
      const out = [];
      for (const op of ctx.ops) {
        if (!op.requestBody || op.requestBodyResolved === false) continue;
        const props = op.requestBody.properties || {};
        for (const [name, prop] of Object.entries(props)) {
          if (prop && prop.type === 'string'
            && prop.maxLength === undefined && !prop.format && !prop.pattern && !prop.enum) {
            out.push(f(this, op, 'Low', this.owasp,
              `Unvalidated string '${name}' in request body`,
              `${endpoint(op)} body property '${name}' is an unconstrained string — no maxLength/format/pattern.`,
              REMEDIATION.unvalidated));
          }
        }
      }
      return out;
    }
  }
];

/** run(ctx) → findings[] across all rules + diagnostics as Info findings. */
export function runStaticChecks(ctx) {
  const findings = [];
  for (const rule of rules) findings.push(...rule.run(ctx));
  for (const d of ctx.diagnostics || []) {
    findings.push({
      checkId: `diag_${d.code}`, severity: d.level === 'error' ? 'High' : 'Info',
      owasp: null, endpoint: null,
      title: `Spec parse note: ${d.code}`,
      evidence: `${d.message} (${d.path})`,
      remediation: 'Unresolvable nodes degrade the affected checks to unverifiable — resolve the $ref or fix the document for full coverage.'
    });
  }
  return findings;
}
