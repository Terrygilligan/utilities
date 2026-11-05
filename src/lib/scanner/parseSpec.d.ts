export interface ScannerDiagnostic { level: string; code: string; message: string; path: string }
export interface SpecParam { name: string; in: 'query' | 'path' | 'header' | 'cookie' | 'body'; required: boolean; schema: any }
export interface SpecOp {
  id: string; method: string; path: string; summary: string;
  params: SpecParam[]; requestBody: any; requestBodyResolved: boolean;
  responses: Record<string, any>; security: any; securityInherited: boolean; deprecated: boolean;
}
export interface SpecCtx {
  info: { title: string; version: string; description: string };
  servers: { url: string }[];
  securitySchemes: Record<string, { type: string | null; scheme: string | null; in: string | null; name: string | null }>;
  globalSecurity: Record<string, any>[];
  globalSecurityInherited: boolean;
  ops: SpecOp[];
  diagnostics: ScannerDiagnostic[];
}
export function parseAndNormalize(text: string): { ctx: SpecCtx | null; diagnostics: ScannerDiagnostic[] };
