import { describe, expect, it } from 'vitest';
import { deviceStatus, formatFingerprint } from '@/utils/deviceStatus';
import { device, ISSUED } from '@/tests/fixtures/devices';

describe('where a device stands', () => {
  it('follows the state of its certificate', () => {
    const now = ISSUED + 1;
    const certificate = device().certificate!;

    expect(deviceStatus(device(), now)).toBe('active');
    expect(deviceStatus(device({ certificate: { ...certificate, state: 'pending' } }), now)).toBe(
      'pending',
    );
    expect(deviceStatus(device({ certificate: { ...certificate, state: 'revoked' } }), now)).toBe(
      'revoked',
    );
    expect(deviceStatus(device({ certificate: null }), now)).toBe('none');
  });

  it('says expired once the certificate ran out, unless it was revoked first', () => {
    const certificate = device().certificate!;
    const later = certificate.expiresAt;

    expect(deviceStatus(device(), later)).toBe('expired');
    expect(deviceStatus(device({ certificate: { ...certificate, state: 'revoked' } }), later)).toBe(
      'revoked',
    );
  });
});

it('writes a fingerprint as browsers do', () => {
  expect(formatFingerprint('ab01cd')).toBe('AB:01:CD');
  expect(formatFingerprint('')).toBe('');
});
