import type { Translations } from '@/i18n';

/**
 * Why something failed, in the language of the page when the reason is a known one: the gateway
 * and the shell answer in English, for the logs.
 */
export function failureMessage(cause: unknown, t: Translations) {
  const reason = cause instanceof Error ? cause.message : String(cause);
  const known: Record<string, string> = {
    'Launcher unavailable': t.launcherUnavailable,
    'wrong password': t.wrongPassword,
    'too many refused attempts': t.tooManyAttempts,
    'devices are unavailable': t.devicesUnavailable,
    'this is the device in use: act on it from another one': t.ownDevice,
    'this device has no certificate of the NAS: install one first': t.mtlsNeedsCertificate,
  };
  return known[reason] ?? reason;
}
