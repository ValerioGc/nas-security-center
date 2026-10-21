import type { Device } from '@/types';

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

/** Formats a SHA-256 fingerprint as uppercase byte pairs separated by colons. */
export function formatFingerprint(fingerprint: string) {
  return (fingerprint.toUpperCase().match(/.{1,2}/g) ?? []).join(':');
}
