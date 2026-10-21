export type Section = 'access' | 'devices' | 'certificates' | 'logs' | 'antivirus';

export interface HttpsSettings {
  port: number;
  force: boolean;
}

export type DeviceIcon = 'tv' | 'desktop' | 'laptop' | 'phone' | 'projector';

/** A certificate stays `pending` until its first sign-in, then becomes `active` or `revoked`. */
export type CertificateState = 'pending' | 'active' | 'revoked';

/** Latest certificate of a device. Times are in milliseconds. */
export interface DeviceCertificate {
  fingerprint: string;
  state: CertificateState;
  issuedAt: number;
  expiresAt: number;
  activatedAt: number | null;
  seenAt: number | null;
}

export interface Device {
  id: number;
  name: string;
  icon: DeviceIcon;
  createdAt: number;
  certificate: DeviceCertificate | null;
  current: boolean;
  sync: boolean;
}

export type DeviceInput = Pick<Device, 'name' | 'icon'>;

/** Whether the NAS requires a device certificate from every browser. */
export interface MtlsState {
  enabled: boolean;
  available: boolean;
  current: Device | null;
}

/** Base64 certificate file of a device and its password, shown only once. */
export interface DeviceCredential {
  file: string;
  fileName: string;
  password: string;
}

export interface IssuedDevice {
  device: Device;
  credential: DeviceCredential;
}

export interface AccessSettings {
  notifyFailures: boolean;
}

export interface DiscoverySettings {
  enabled: boolean;
}

export type AccessRuleKind = 'ip' | 'range';

export interface AccessRule {
  id: string;
  kind: AccessRuleKind;
  value: string;
  label: string;
  createdAt: number;
}

export type NewAccessRule = Pick<AccessRule, 'kind' | 'value' | 'label'>;

/** Lockout after failed sign-ins, enforced by the gateway. */
export interface SignInPolicy {
  enabled: boolean;
  attempts: number;
  lockMinutes: number;
}

export interface RefusedSignIn {
  id: string;
  at: number;
  from: string;
  field: string;
}

/** Certificate details from the gateway. Times are in seconds. */
export interface CertificateDetails {
  subject: string;
  issuer: string;
  /** Host names and IP addresses covered by the certificate. */
  names: string[];
  notBefore: number;
  notAfter: number;
  fingerprint: string;
}

export interface ServerCertificate {
  served: boolean;
  custom: boolean;
  active: CertificateDetails | null;
  authority: CertificateDetails;
  /** Names covered by the NAS certificate by default. */
  automaticNames: string[];
  extraNames: string[];
}

export type ScanKind = 'full' | 'quick' | 'file' | 'custom';

export interface ScanOptions {
  archives: boolean;
  detectPua: boolean;
  maxFileMb: number;
  paths: string[];
  exclusions: string[];
}

export interface AntivirusSchedule {
  id: string;
  enabled: boolean;
  kind: ScanKind;
  day: string;
  time: string;
  paths: string[];
}

export interface LifecycleScan {
  enabled: boolean;
  kind: ScanKind;
  paths: string[];
}

export interface AntivirusSettings {
  enabled: boolean;
  schedulerEnabled: boolean;
  bootScan: LifecycleScan;
  shutdownScan: LifecycleScan;
  autoQuarantine: boolean;
  full: ScanOptions;
  quick: ScanOptions;
  file: ScanOptions;
  custom: ScanOptions;
  schedules: AntivirusSchedule[];
}

export interface AntivirusDetection {
  id: string;
  path: string;
  threat: string;
}

export interface QuarantineEntry {
  detection: AntivirusDetection;
  at: number;
}

export interface AntivirusReport {
  at: number;
  kind: ScanKind | null;
  scanned: number;
  found: number;
  skipped: number;
  planned: number;
  detections: AntivirusDetection[];
  quarantine: QuarantineEntry[];
  error: string | null;
}

export interface AntivirusStatus {
  settings: AntivirusSettings;
  installed: boolean;
  operation: { phase: string; progress: number | null; error: string | null };
  report: AntivirusReport;
}
