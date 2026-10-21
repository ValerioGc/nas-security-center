import { askNasShell } from '@/services/nasShell';
import type { Device, DeviceInput, IssuedDevice, MtlsState } from '@/types';

/**
 * Device requests, relayed by the shell to the gateway. Issuing a certificate and toggling mTLS
 * require the account password, which the shell verifies with the gateway without storing it.
 */

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
