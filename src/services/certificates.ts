import { askNasShell } from '@/services/nasShell';
import type { ServerCertificate } from '@/types';

/**
 * HTTPS certificate requests, relayed by the shell to the gateway. Every change requires the
 * account password and returns the updated state.
 */

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
