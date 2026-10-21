import { beforeEach, expect, it, vi } from 'vitest';
import { useAntivirus } from '@/composables/useAntivirus';
import { askNasShell } from '@/services/nasShell';
import { antivirusStatus } from '@/tests/fixtures/antivirus';
vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));
beforeEach(() => vi.mocked(askNasShell).mockReset());
it('retains the error of a rejected action and serializes operations', async () => {
  const client = useAntivirus();
  vi.mocked(askNasShell).mockRejectedValueOnce(new Error('installation failed'));
  expect(await client.enable(true)).toBe(false);
  expect(client.error.value).toBe('installation failed');
  vi.mocked(askNasShell).mockResolvedValue(antivirusStatus(true));
  await client.load();
  const promise = client.scan('quick', []);
  expect(client.busy.value).toBe(true);
  expect(await client.enable(false)).toBe(false);
  await promise;
  expect(client.busy.value).toBe(false);
});
