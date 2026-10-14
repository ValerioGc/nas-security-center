import { askNasShell } from '@/services/nasShell';
import type { ServerCertificate } from '@/types';

/**
 * The certificate HTTPS answers with, through the shell, which asks the gateway. Every change takes
 * the password of the account once more and comes back as the new state.
 */

// The password is checked, and a certificate issued or checked: more than the usual wait.
const SLOW_MS = 30000;

export const readCertificate = () => askNasShell<ServerCertificate>('certificate');

export const saveCertificateNames = (names: string[], password: string) =>
  askNasShell<ServerCertificate>('save-certificate-names', { names, password }, SLOW_MS);

export const renewCertificate = (password: string) =>
  askNasShell<ServerCertificate>('renew-certificate', { password }, SLOW_MS);

export const uploadCertificate = (certificate: string, key: string, password: string) =>
  askNasShell<ServerCertificate>('upload-certificate', { certificate, key, password }, SLOW_MS);

export const removeCustomCertificate = (password: string) =>
  askNasShell<ServerCertificate>('remove-custom-certificate', { password }, SLOW_MS);
