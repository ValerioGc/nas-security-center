import { askNasShell } from '@/services/nasShell';
import type { Device, DeviceInput, IssuedDevice, MtlsState } from '@/types';

/**
 * The devices allowed in with a certificate of the NAS, through the shell, which asks the gateway.
 * Issuing a certificate and turning mTLS on or off take the password of the account once more: the
 * shell checks it with the gateway and keeps nothing of it.
 */

// The password is checked and, for a certificate, a key made and sealed in its file: more than
// the usual wait.
const SLOW_MS = 30000;

export const readMtls = () => askNasShell<MtlsState>('mtls-state');

export const saveMtls = (enabled: boolean, password: string) =>
  askNasShell<MtlsState>('save-mtls', { enabled, password }, SLOW_MS);

export const listDevices = () => askNasShell<Device[]>('devices');

export const addDevice = (input: DeviceInput, password: string) =>
  askNasShell<IssuedDevice>('add-device', { ...input, password }, SLOW_MS);

export const updateDevice = (id: number, input: DeviceInput) =>
  askNasShell<Device>('update-device', { id, ...input });

export const renewDevice = (id: number, password: string) =>
  askNasShell<IssuedDevice>('renew-device', { id, password }, SLOW_MS);

export const revokeDevice = (id: number) => askNasShell<Device>('revoke-device', { id });

export const removeDevice = (id: number) => askNasShell<null>('remove-device', { id });
