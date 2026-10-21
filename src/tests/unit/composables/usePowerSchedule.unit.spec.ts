import { expect, it, vi } from 'vitest';
import { scheduleWeekdays, usePowerSchedule, stopsSoon } from '@/composables/usePowerSchedule';
import { askNasShell } from '@/services/nasShell';
import type { PowerRule } from '@valeriogc/nas-base-app';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));

const rule = (day: PowerRule['day'], time: string, action: PowerRule['action']): PowerRule => ({
  day,
  time,
  action,
});

it('checks recurring jobs on their weekdays and across the week boundary', () => {
  const job = {
    id: 'one',
    enabled: true,
    kind: 'quick' as const,
    day: 'Wed',
    time: '23:50',
    paths: [],
  };
  expect(scheduleWeekdays(job)).toEqual([3]);
  expect(scheduleWeekdays({ ...job, day: '*' })).toHaveLength(7);
  expect(stopsSoon({ enabled: true, rules: [rule('monday', '00:10', 'restart')] }, [7], 1430)).toBe(
    true,
  );
  expect(stopsSoon({ enabled: true, rules: [rule('monday', '00:10', 'restart')] }, [6], 1430)).toBe(
    false,
  );
  expect(stopsSoon(null, [1], 0)).toBe(false);
});
it('loads through the shared bridge, serializes reads and refreshes each opening', async () => {
  vi.mocked(askNasShell)
    .mockReset()
    .mockResolvedValue({ enabled: true, rules: [rule('everyday', '23:00', 'shutdown')] });
  const power = usePowerSchedule();
  expect(power.state.value).toBe('loading');
  await Promise.all([power.load(), power.load()]);
  expect(askNasShell).toHaveBeenCalledTimes(1);
  expect(power.state.value).toBe('ready');
  const job = {
    id: 'one',
    enabled: true,
    kind: 'quick' as const,
    day: '*',
    time: '23:10',
    paths: [],
  };
  expect(power.conflict(job)).toBe('off');
  expect(power.conflict({ ...job, time: '22:30' })).toBe('soon');
  expect(power.conflict({ ...job, time: '22:29' })).toBeNull();
  expect(power.conflict({ ...job, enabled: false })).toBeNull();
  expect(power.conflict({ ...job, time: 'invalid' })).toBeNull();
  vi.mocked(askNasShell).mockResolvedValue({ enabled: false, rules: [] });
  await power.load();
  expect(power.state.value).toBe('alwaysOn');
});
it('reports failed and malformed replies as unavailable', async () => {
  vi.mocked(askNasShell)
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValueOnce({
      enabled: true,
      rules: [{ day: 'unknown', time: '25:00', action: 'start' }],
    })
    .mockResolvedValueOnce(undefined);
  const power = usePowerSchedule();
  for (let index = 0; index < 3; index++) {
    await power.load();
    expect(power.state.value).toBe('unavailable');
  }
});
