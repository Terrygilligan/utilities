import type { SpecCtx } from './parseSpec';
import type { ScanFinding } from './staticChecks';

export interface DynamicResult {
  findings: ScanFinding[];
  probed: number;
  unverifiable: number;
  refused?: 'consent_required' | 'no_base_url' | 'http_target' | 'cors_tight';
  remaining?: number;
}
export interface DynamicOpts {
  consent: boolean;
  token?: string;
  onProgress?: (kind: string, url: string) => void;
  fetchImpl?: (url: string, init?: any) => Promise<any>;
}
export declare function runDynamicChecks(target: SpecCtx | { baseUrl?: string; ops?: any[] }, opts?: DynamicOpts): Promise<DynamicResult>;
