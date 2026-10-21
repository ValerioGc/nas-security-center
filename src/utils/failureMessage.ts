import type { Translations } from '@/i18n';

export function failureMessage(cause: unknown, t: Translations) {
  const reason = cause instanceof Error ? cause.message : String(cause);
  const known: Record<string, string> = {
    'the HTTPS port is already in use or unavailable': t.httpsPortUnavailable,
    'HTTPS settings could not be applied': t.httpsSaveFailed,
    'Launcher unavailable': t.launcherUnavailable,
    'wrong password': t.wrongPassword,
    'too many refused attempts': t.tooManyAttempts,
    'devices are unavailable': t.devicesUnavailable,
    'this is the device in use: act on it from another one': t.ownDevice,
    'this device has no certificate of the NAS: install one first': t.mtlsNeedsCertificate,
  };
  return known[reason] ?? reason;
}
