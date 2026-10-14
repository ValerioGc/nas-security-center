import type { Device, DeviceCredential, MtlsState } from '@/types';

const DAY = 86_400_000;
export const ISSUED = Date.UTC(2026, 9, 2, 9, 30);

/** A device with an active certificate, changed by `changes`. */
export function device(changes: Partial<Device> = {}): Device {
  return {
    id: 1,
    name: 'Portatile in studio',
    icon: 'laptop',
    createdAt: ISSUED,
    certificate: {
      fingerprint: 'ab'.repeat(32),
      state: 'active',
      issuedAt: ISSUED,
      expiresAt: ISSUED + 825 * DAY,
      activatedAt: ISSUED + DAY,
      seenAt: ISSUED + 2 * DAY,
    },
    current: false,
    ...changes,
  };
}

export function mtlsState(changes: Partial<MtlsState> = {}): MtlsState {
  return { enabled: false, available: true, current: null, ...changes };
}

export const CREDENTIAL: DeviceCredential = {
  file: btoa('p12'),
  fileName: 'nas-os-tablet.p12',
  password: 'Kq7Zr2mVx9Lp4Tn8Wc3B',
};
