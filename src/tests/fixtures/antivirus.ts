import type { AntivirusStatus, ScanOptions } from '@/types';

export function scanOptions(): ScanOptions {
  return { archives: true, detectPua: false, maxFileMb: 100, paths: [], exclusions: [] };
}
export function antivirusStatus(enabled = false): AntivirusStatus {
  return {
    settings: {
      enabled,
      schedulerEnabled: false,
      bootScan: { enabled: false, kind: 'quick', paths: [] },
      shutdownScan: { enabled: false, kind: 'quick', paths: [] },
      autoQuarantine: false,
      full: scanOptions(),
      quick: scanOptions(),
      file: scanOptions(),
      custom: scanOptions(),
      schedules: [],
    },
    installed: enabled,
    operation: { phase: '', progress: null, error: null },
    report: {
      at: 0,
      kind: null,
      scanned: 0,
      found: 0,
      skipped: 0,
      planned: 0,
      detections: [],
      quarantine: [],
      error: null,
    },
  };
}
