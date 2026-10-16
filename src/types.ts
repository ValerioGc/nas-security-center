/** The sections of the application, in the order of the sidebar. */
export type Section = 'access' | 'devices' | 'certificates' | 'logs' | 'antivirus';

export interface HttpsSettings {
  port: number;
  force: boolean;
}

/** The icons a device can be shown with. */
export type DeviceIcon = 'tv' | 'desktop' | 'laptop' | 'phone' | 'projector';

/**
 * Where a certificate stands: `pending` from its issue to the first sign-in made with it, then
 * `active`, or `revoked` once it no longer lets the device in.
 */
export type CertificateState = 'pending' | 'active' | 'revoked';

/** The newest certificate of a device, as the gateway keeps it. Times in milliseconds. */
export interface DeviceCertificate {
  fingerprint: string;
  state: CertificateState;
  issuedAt: number;
  expiresAt: number;
  activatedAt: number | null;
  seenAt: number | null;
}

/** A device allowed in with a certificate of the NAS. */
export interface Device {
  id: number;
  name: string;
  icon: DeviceIcon;
  createdAt: number;
  certificate: DeviceCertificate | null;
  /** The device this page is open on. */
  current: boolean;
  /** A computer of the sync client: it renews its certificate itself, with the password. */
  sync: boolean;
}

/** What a device is created with, and what an edit changes. */
export type DeviceInput = Pick<Device, 'name' | 'icon'>;

/** Whether the NAS asks every browser for a certificate of a device. */
export interface MtlsState {
  enabled: boolean;
  /** False on a gateway without an authority: mTLS cannot be turned on. */
  available: boolean;
  current: Device | null;
}

/** The file of a device certificate, in base64, and its password: shown once. */
export interface DeviceCredential {
  file: string;
  fileName: string;
  password: string;
}

/** A device with the certificate just issued for it. */
export interface IssuedDevice {
  device: Device;
  credential: DeviceCredential;
}

/** The access settings the launcher keeps. */
export interface AccessSettings {
  notifyFailures: boolean;
}

/** Whether NAS Finder may find the NAS on the local network. */
export interface DiscoverySettings {
  enabled: boolean;
}

/** How an allowed entry is matched: an exact address or a CIDR range. */
export type AccessRuleKind = 'ip' | 'range';

/** One entry of the list of who may reach the NAS, as the launcher lists it. */
export interface AccessRule {
  id: string;
  kind: AccessRuleKind;
  value: string;
  label: string;
  createdAt: number;
}

/** A rule as the form sends it. */
export type NewAccessRule = Pick<AccessRule, 'kind' | 'value' | 'label'>;

/** The lock after failed sign-ins, which belongs to the gateway. */
export interface SignInPolicy {
  enabled: boolean;
  attempts: number;
  lockMinutes: number;
}

/** A refused sign-in, as the launcher noted it. */
export interface RefusedSignIn {
  id: string;
  at: number;
  from: string;
  field: string;
}

/** A certificate as the gateway describes it. Times in seconds. */
export interface CertificateDetails {
  subject: string;
  issuer: string;
  /** The host names and addresses it is valid for. */
  names: string[];
  notBefore: number;
  notAfter: number;
  fingerprint: string;
}

/** The certificate HTTPS answers with, and what it is made of. */
export interface ServerCertificate {
  /** The gateway answers HTTPS: a development copy may serve plain HTTP only. */
  served: boolean;
  /** The certificate in use was brought by the user instead of the NAS's own. */
  custom: boolean;
  active: CertificateDetails | null;
  authority: CertificateDetails;
  /** The names the NAS's own certificate covers by itself. */
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
  /** Files left out because they were found clean and did not change since. */
  skipped: number;
  /** Files sent to ClamAV, when the scan knew them beforehand; 0 otherwise. */
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
