import type { SpecCtx } from './parseSpec';
import type { ScanFinding } from './staticChecks';
import type { DynamicResult } from './dynamicChecks';

export interface ScanReport {
  generatedAt: string;
  api: { title: string; version: string } | null;
  score: number | null;
  scoreBasis: string;
  counts: { critical: number; high: number; medium: number; low: number; info: number; passed: number; unverifiable: number };
  owasp: Record<string, number>;
  findings: ScanFinding[];
  dynamic: DynamicResult | null;
}
export declare const OWASP_API_2023: Record<string, string>;
export declare function buildReport(args: { ctx: SpecCtx | null; findings?: ScanFinding[]; dynamic?: DynamicResult | null }): ScanReport;
export declare function exportJson(report: ScanReport): Blob;
export declare const REMEDIATION_SNIPPETS: Record<string, Record<string, string>>;
