import type { Device } from '@/types';

/** Where a device stands with its certificate, as the list and the details show it. */
export type DeviceStatus = 'pending' | 'active' | 'revoked' | 'expired' | 'none';

export function deviceStatus(device: Device, now = Date.now()): DeviceStatus {
  const certificate = device.certificate;
  if (!certificate) {
    return 'none';
  }
  if (certificate.state !== 'revoked' && certificate.expiresAt <= now) {
    return 'expired';
  }
  return certificate.state;
}

/** A SHA-256 fingerprint as browsers show it: pairs of upper-case digits split by colons. */
export function formatFingerprint(fingerprint: string) {
  return (fingerprint.toUpperCase().match(/.{1,2}/g) ?? []).join(':');
}
