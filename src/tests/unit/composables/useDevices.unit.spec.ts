import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDevices } from '@/composables/useDevices';
import { setLocale } from '@/i18n';
import { askNasShell } from '@/services/nasShell';
import { device, mtlsState } from '@/tests/fixtures/devices';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));

function answering(answers: Record<string, unknown>) {
  vi.mocked(askNasShell).mockImplementation(async (type: string) => {
    const answer = answers[type];
    if (answer instanceof Error) {
      throw answer;
    }
    return answer as never;
  });
}

beforeEach(() => {
  setLocale('it');
  vi.mocked(askNasShell).mockReset();
  answering({ 'mtls-state': mtlsState(), devices: [device()] });
});

describe('the devices section', () => {
  it('reads the state of mTLS and the devices together', async () => {
    const devices = useDevices();
    await devices.load();

    expect(devices.mtls.value).toEqual(mtlsState());
    expect(devices.devices.value).toEqual([device()]);
    expect(devices.loading.value).toBe(false);
    expect(devices.error.value).toBe('');
  });

  it('says why the read failed, in the language of the page', async () => {
    answering({ 'mtls-state': new Error('devices are unavailable'), devices: [] });
    const devices = useDevices();
    await devices.load();

    expect(devices.error.value).toBe(
      'Il gateway non risponde. I dispositivi non sono disponibili.',
    );
    expect(devices.mtls.value).toBeNull();
  });

  it('keeps a changed device in its place, a new one at the end, and drops a removed one', async () => {
    const devices = useDevices();
    await devices.load();

    devices.keep(device({ name: 'Rinominato' }));
    devices.keep(device({ id: 2, name: 'Tablet' }));
    expect(devices.devices.value.map((item) => item.name)).toEqual(['Rinominato', 'Tablet']);

    devices.drop(1);
    expect(devices.devices.value.map((item) => item.id)).toEqual([2]);
  });

  it('turns mTLS on with the password and keeps what the gateway answered', async () => {
    answering({ 'save-mtls': mtlsState({ enabled: true }) });
    const devices = useDevices();
    await devices.switchMtls(true, 'secret');

    expect(askNasShell).toHaveBeenCalledWith(
      'save-mtls',
      { enabled: true, password: 'secret' },
      30000,
    );
    expect(devices.mtls.value?.enabled).toBe(true);
  });
});
