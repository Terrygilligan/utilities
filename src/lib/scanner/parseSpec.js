/**
 * parseSpec — OpenAPI 3.x / Swagger 2.0 text → normalized ctx.
 * Pure client-side: JSON or YAML (js-yaml is the only dep). Internal
 * `$ref` resolution only — external refs degrade to diagnostics, never
 * network-fetched. Depth-capped + circular-safe.
 *
 * Output contract (locked):
 * { info:{title,version,description}, servers:[{url}],
 *   securitySchemes:{[name]:{type,scheme,in,name}},
 *   globalSecurity:[{[schemeName]:[]}], globalSecurityInherited,
 *   ops:[{id,method,path,summary,params:[{name,in,required,schema}],
 *         requestBody, requestBodyResolved, responses:{[status]:obj},
 *         security, securityInherited, deprecated }],
 *   diagnostics:[{level,code,message,path}] }
 */

import yaml from 'js-yaml';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const MAX_REF_DEPTH = 8;
const MAX_SPEC_BYTES = 2 * 1024 * 1024;

function diag(diagnostics, level, code, message, path) {
  diagnostics.push({ level, code, message: String(message).slice(0, 300), path: path || '#' });
}

/** JSON-pointer-ish resolver for internal refs; null when unresolvable. */
function lookupRef(doc, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return undefined;
  let node = doc;
  for (const seg of ref.slice(2).split('/')) {
    const key = seg.replace(/~1/g, '/').replace(/~0/g, '~');
    if (node == null || typeof node !== 'object') return undefined;
    node = node[key];
  }
  return node === undefined ? undefined : node;
}

/**
 * Deep-resolves internal `$ref` chains. Cycle/depth/external/missing all
 * resolve to `null` and push a diagnostic — callers treat null as
 * "unverifiable", never "pass".
 */
function makeResolver(doc, diagnostics) {
  const seen = new Set();
  function resolveRef(ref, path) {
    if (!ref.startsWith('#/')) {
      diag(diagnostics, 'info', 'ref_external', `external $ref unresolvable (no fetching): ${ref}`, path);
      return null;
    }
    const target = lookupRef(doc, ref);
    if (target === undefined) {
      diag(diagnostics, 'warn', 'ref_missing', `unresolvable $ref: ${ref}`, path);
      return null;
    }
    return target;
  }
  function resolve(node, path, depth, stack) {
    if (node == null || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
      return node.map((n, i) => resolve(n, `${path}/${i}`, depth, stack));
    }
    if (typeof node.$ref === 'string') {
      if (depth >= MAX_REF_DEPTH) {
        diag(diagnostics, 'warn', 'ref_depth', `$ref depth cap (${MAX_REF_DEPTH}) at ${node.$ref}`, path);
        return null;
      }
      if (stack.includes(node.$ref)) {
        // Circular: emit the already-resolving placeholder — guard against
        // infinite recursion; checks downstream treat null as unverifiable.
        diag(diagnostics, 'info', 'ref_circular', `circular $ref collapsed: ${node.$ref}`, path);
        return null;
      }
      const target = resolveRef(node.$ref, path);
      if (target === null) return null;
      return resolve(target, node.$ref, depth + 1, [...stack, node.$ref]);
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = resolve(v, `${path}/${k}`, depth, stack);
    return out;
  }
  return resolve;
}

/** Pull one op's parameters (path-item level merged under op level). */
function collectParams(resolve, pathItem, op, pathStr, method, diagnostics) {
  const merged = [];
  const seen = new Set();
  for (const src of [pathItem.parameters, op.parameters]) {
    if (!Array.isArray(src)) continue;
    for (const raw of src) {
      const p = resolve(raw, `#/paths${pathStr}/${method}/parameters`, 0, []);
      if (!p || typeof p !== 'object') continue;
      const key = `${p.name}:${p.in}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        name: p.name || '',
        in: p.in === 'query' || p.in === 'path' || p.in === 'header' || p.in === 'cookie'
          ? p.in
          : 'query',
        required: !!p.required,
        schema: p.schema || (p.type ? { type: p.type } : null)
      });
    }
  }
  return merged;
}

/** OpenAPI 3.x requestBody → resolved schema (or null + flag). */
function resolveBody(resolve, op, diagnostics, path) {
  const raw = op.requestBody;
  if (!raw) return { requestBody: null, requestBodyResolved: true };
  const resolved = resolve(raw, `${path}/requestBody`, 0, []);
  if (!resolved || typeof resolved !== 'object') {
    return { requestBody: null, requestBodyResolved: false };
  }
  const content = resolved.content || resolved; // swagger 2.0: body param shape
  const jsonContent = content['application/json'] || content['application/*+json']
    || Object.values(content).find((c) => c && c.schema);
  const schema = jsonContent && jsonContent.schema
    ? resolve(jsonContent.schema, `${path}/requestBody/schema`, 0, [])
    : (resolved.type ? resolved : null);
  return { requestBody: schema, requestBodyResolved: schema !== null };
}

function normalizeSecuritySchemes(spec, resolve, isV2) {
  const raw = isV2 ? spec.securityDefinitions : spec.components && spec.components.securitySchemes;
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [name, def] of Object.entries(raw)) {
    const r = resolve(def, `#/securitySchemes/${name}`, 0, []);
    if (!r || typeof r !== 'object') continue;
    out[name] = {
      type: r.type || null,
      scheme: r.scheme || null,
      in: r.in || null,
      name: r.name || null
    };
  }
  return out;
}

/**
 * parseAndNormalize(text) → { ctx | null, diagnostics }
 * ctx is null when the input can't be parsed or isn't an OpenAPI doc.
 */
export function parseAndNormalize(text) {
  const diagnostics = [];
  if (typeof text === 'string' && text.length > MAX_SPEC_BYTES) {
    diag(diagnostics, 'error', 'spec_too_large',
      `spec is ${(text.length / 1024 / 1024).toFixed(1)} MB — the limit is 2 MB. Large generated specs should be split or filtered before scanning.`,
      '#');
    return { ctx: null, diagnostics };
  }
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    try {
      doc = yaml.load(text, { json: true });
    } catch (err) {
      diag(diagnostics, 'error', 'parse', `input is neither JSON nor YAML: ${err.message}`, '#');
      return { ctx: null, diagnostics };
    }
  }
  if (!doc || typeof doc !== 'object') {
    diag(diagnostics, 'error', 'parse', 'parsed document is not an object', '#');
    return { ctx: null, diagnostics };
  }

  const isV3 = typeof doc.openapi === 'string' && doc.openapi.startsWith('3.');
  const isV2 = typeof doc.swagger === 'string' && doc.swagger.startsWith('2.');
  if (!isV3 && !isV2) {
    diag(diagnostics, 'error', 'version',
      `not an OpenAPI 3.x or Swagger 2.0 document (openapi=${doc.openapi || 'absent'})`, '#');
    return { ctx: null, diagnostics };
  }

  const resolve = makeResolver(doc, diagnostics);

  const servers = [];
  if (isV3 && Array.isArray(doc.servers)) {
    for (const s of doc.servers) {
      if (s && typeof s.url === 'string') servers.push({ url: s.url });
    }
  } else if (isV2) {
    const schemes = Array.isArray(doc.schemes) && doc.schemes.length ? doc.schemes : ['https'];
    const base = `${schemes[0]}://${doc.host || ''}${doc.basePath || ''}`;
    if (doc.host) servers.push({ url: base });
  }

  const securitySchemes = normalizeSecuritySchemes(doc, resolve, isV2);
  const globalSecurity = Array.isArray(doc.security) ? doc.security : [];
  const globalSecurityInherited = doc.security === undefined;

  const ops = [];
  const paths = doc.paths && typeof doc.paths === 'object' ? doc.paths : {};
  for (const [pathStr, rawItem] of Object.entries(paths)) {
    const pathItem = resolve(rawItem, `#/paths${pathStr}`, 0, []);
    if (!pathItem || typeof pathItem !== 'object') {
      diag(diagnostics, 'warn', 'path_unresolvable', `path item unresolvable: ${pathStr}`, `#/paths${pathStr}`);
      continue;
    }
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;
      const { requestBody, requestBodyResolved } = resolveBody(
        resolve, op, diagnostics, `#/paths${pathStr}/${method}`
      );
      const responses = {};
      for (const [status, rDef] of Object.entries(op.responses || {})) {
        responses[status] = resolve(rDef, `#/paths${pathStr}/${method}/responses/${status}`, 0, []);
      }
      ops.push({
        id: op.operationId || `${method.toUpperCase()} ${pathStr}`,
        method: method.toUpperCase(),
        path: pathStr,
        summary: op.summary || op.description || '',
        params: collectParams(resolve, pathItem, op, pathStr, method, diagnostics),
        requestBody,
        requestBodyResolved,
        responses,
        security: op.security,
        securityInherited: op.security === undefined,
        deprecated: op.deprecated === true
      });
    }
  }
  if (!ops.length) {
    diag(diagnostics, 'warn', 'no_ops', 'document declares no operations', '#/paths');
  }

  return {
    ctx: {
      info: {
        title: (doc.info && doc.info.title) || '',
        version: (doc.info && doc.info.version) || '',
        description: (doc.info && doc.info.description) || ''
      },
      servers,
      securitySchemes,
      globalSecurity,
      globalSecurityInherited,
      ops,
      diagnostics
    },
    diagnostics
  };
}
