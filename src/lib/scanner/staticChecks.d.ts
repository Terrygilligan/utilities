import type { SpecCtx } from './parseSpec';

export interface ScanFinding {
  checkId: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  owasp: string | null;
  endpoint: string | null;
  title: string;
  evidence: string;
  remediation: string | null;
  positive?: boolean;
  unverifiable?: boolean;
}
export interface ScanRule {
  id: string; severity: string; owasp: string | null;
  run(ctx: SpecCtx): ScanFinding[];
}
export declare const rules: ScanRule[];
export declare function runStaticChecks(ctx: SpecCtx): ScanFinding[];
