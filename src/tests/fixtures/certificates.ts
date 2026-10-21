import type { CertificateDetails, ServerCertificate } from '@/types';

export function details(overrides: Partial<CertificateDetails> = {}): CertificateDetails {
  return {
    subject: 'nas',
    issuer: 'nas-os NAS authority',
    names: ['nas', 'nas.local', 'localhost', '127.0.0.1'],
    notBefore: 1_780_000_000,
    notAfter: 1_810_000_000,
    fingerprint: 'ab'.repeat(32),
    ...overrides,
  };
}

export function serverCertificate(overrides: Partial<ServerCertificate> = {}): ServerCertificate {
  return {
    served: true,
    custom: false,
    active: details(),
    authority: details({ subject: 'nas-os NAS authority', names: [], notAfter: 2_400_000_000 }),
    automaticNames: ['nas', 'nas.local', 'localhost', '127.0.0.1'],
    extraNames: [],
    ...overrides,
  };
}
