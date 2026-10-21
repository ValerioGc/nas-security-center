import { beforeEach, expect, it, vi } from 'vitest';
import {
  addDevice,
  listDevices,
  readMtls,
  removeDevice,
  renewDevice,
  revokeDevice,
  saveMtls,
  updateDevice,
} from '@/services/devices';
import { askNasShell } from '@/services/nasShell';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));

beforeEach(() => vi.mocked(askNasShell).mockReset().mockResolvedValue(null));

it('asks the shell for each request, with more time where the password is checked', async () => {
  await readMtls();
  await saveMtls(true, 'secret');
  await listDevices();
  await addDevice({ name: 'Tablet', icon: 'phone' }, 'secret');
  await updateDevice(2, { name: 'TV', icon: 'tv' });
  await renewDevice(2, 'secret');
  await revokeDevice(2);
  await removeDevice(2);

  expect(vi.mocked(askNasShell).mock.calls).toEqual([
    ['mtls-state'],
    ['save-mtls', { enabled: true, password: 'secret' }, 30000],
    ['devices'],
    ['add-device', { name: 'Tablet', icon: 'phone', password: 'secret' }, 30000],
    ['update-device', { id: 2, name: 'TV', icon: 'tv' }],
    ['renew-device', { id: 2, password: 'secret' }, 30000],
    ['revoke-device', { id: 2 }],
    ['remove-device', { id: 2 }],
  ]);
});
