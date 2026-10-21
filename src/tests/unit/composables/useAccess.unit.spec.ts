import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useAccess } from '@/composables/useAccess';
import { askNasShell } from '@/services/nasShell';
import type { AccessRule } from '@/types';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));

const laptop: AccessRule = {
  id: '1',
  kind: 'ip',
  value: '192.168.1.20',
  label: 'Portatile',
  createdAt: 0,
};

type Answers = Partial<Record<string, unknown>>;

function answering(answers: Answers) {
  vi.mocked(askNasShell).mockImplementation(async (type: string, payload?: unknown) => {
    const answer = type in answers ? answers[type] : payload;
    if (answer instanceof Error) {
      throw answer;
    }
    return answer as never;
  });
}

const DEFAULTS: Answers = {
  'access-settings': { notifyFailures: false },
  'access-rules': [],
  'sign-in-policy': { enabled: true, attempts: 5, lockMinutes: 1 },
  'discovery-settings': { enabled: false },
};

beforeEach(() => {
  vi.mocked(askNasShell).mockReset();
  answering(DEFAULTS);
});

describe('the access of the NAS', () => {
  it('loads the settings, the rules and the lock, and has nothing to save at first', async () => {
    answering({ ...DEFAULTS, 'access-rules': [laptop] });
    const access = useAccess();
    await access.load();

    expect(access.settings.value).toEqual({ notifyFailures: false });
    expect(access.rules.value).toEqual([laptop]);
    expect(access.policy.value).toEqual({ enabled: true, attempts: 5, lockMinutes: 1 });
    expect(access.discovery.value).toEqual({ enabled: false });
    expect(access.changed.value).toBe(false);
    await access.save();
    expect(askNasShell).toHaveBeenCalledTimes(4);
  });

  it('opens and closes the discovery on its own, and puts the switch back when refused', async () => {
    const access = useAccess();
    await access.load();

    await access.saveDiscovery(true);
    expect(askNasShell).toHaveBeenCalledWith('save-discovery-settings', { enabled: true });
    expect(access.discovery.value).toEqual({ enabled: true });
    expect(askNasShell).not.toHaveBeenCalledWith('save-access-settings', expect.anything());

    answering({ ...DEFAULTS, 'save-discovery-settings': new Error('polkit refused') });
    access.discovery.value = { enabled: false };
    await access.saveDiscovery(false);
    expect(access.discovery.value).toEqual({ enabled: true });
    expect(access.discoveryError.value).toBe('polkit refused');
    expect(access.discoveryBusy.value).toBe(false);
  });

  it('says why the discovery cannot be read, and still shows the rest', async () => {
    answering({ ...DEFAULTS, 'discovery-settings': new Error('Launcher unavailable') });
    const access = useAccess();
    await access.load();

    expect(access.discovery.value).toBeNull();
    expect(access.discoveryError.value).toBe('Launcher unavailable');
    expect(access.settings.value).toEqual({ notifyFailures: false });
    expect(access.error.value).toBe('');
  });

  it('saves only what changed: the settings to the launcher, the lock to the gateway', async () => {
    const access = useAccess();
    await access.load();

    access.settings.value!.notifyFailures = true;
    expect(access.changed.value).toBe(true);
    await access.save();
    expect(askNasShell).toHaveBeenCalledWith('save-access-settings', { notifyFailures: true });
    expect(askNasShell).not.toHaveBeenCalledWith('save-sign-in-policy', expect.anything());
    expect(access.changed.value).toBe(false);

    access.policy.value!.attempts = 3;
    await access.save();
    expect(askNasShell).toHaveBeenCalledWith('save-sign-in-policy', {
      enabled: true,
      attempts: 3,
      lockMinutes: 1,
    });
  });

  it('offers no save for a lock outside its limits', async () => {
    const access = useAccess();
    await access.load();

    for (const [attempts, lockMinutes] of [
      [0, 1],
      [21, 1],
      [2.5, 1],
      [3, 0],
      [3, 1441],
    ]) {
      access.policy.value = { enabled: true, attempts, lockMinutes };
      expect(access.policyValid.value, `${attempts} ${lockMinutes}`).toBe(false);
      expect(access.changed.value).toBe(false);
    }
  });

  it('says when the gateway does not answer, and keeps the rest', async () => {
    answering({ ...DEFAULTS, 'sign-in-policy': new Error('down') });
    const access = useAccess();
    await access.load();

    expect(access.policy.value).toBeNull();
    expect(access.policyUnavailable.value).toBe(true);
    expect(access.settings.value).toEqual({ notifyFailures: false });
    expect(access.policyValid.value).toBe(true);
  });

  it('says why the launcher could not be read', async () => {
    answering({ ...DEFAULTS, 'access-settings': new Error('Launcher unavailable') });
    const access = useAccess();
    await access.load();

    expect(access.error.value).toBe('Launcher unavailable');
    expect(access.settings.value).toBeNull();
    expect(access.loading.value).toBe(false);
  });

  it('reports a save the launcher or the gateway refused', async () => {
    answering({
      ...DEFAULTS,
      'save-access-settings': new Error('settings unavailable'),
      'save-sign-in-policy': 'not an error',
    });
    const access = useAccess();
    await access.load();
    access.settings.value!.notifyFailures = true;
    await access.save();
    expect(access.error.value).toBe('settings unavailable');

    answering({ ...DEFAULTS, 'save-sign-in-policy': new Error('down') });
    const lock = useAccess();
    await lock.load();
    lock.policy.value!.enabled = false;
    await lock.save();
    expect(lock.error.value).toBe('down');
  });

  it('adds and removes a rule at once, and keeps the reason of a refusal', async () => {
    answering({
      ...DEFAULTS,
      'add-access-rule': [laptop],
      'remove-access-rule': [],
    });
    const access = useAccess();
    await access.load();

    await expect(access.addRule({ kind: 'ip', value: '192.168.1.20', label: '' })).resolves.toBe(
      true,
    );
    expect(access.rules.value).toEqual([laptop]);
    await access.removeRule(laptop);
    expect(askNasShell).toHaveBeenCalledWith('remove-access-rule', { id: '1' });
    expect(access.rules.value).toEqual([]);

    answering({ ...DEFAULTS, 'add-access-rule': new Error('invalid IP address') });
    await expect(access.addRule({ kind: 'ip', value: 'x', label: '' })).resolves.toBe(false);
    expect(access.ruleError.value).toBe('invalid IP address');
    expect(access.ruleBusy.value).toBe(false);
  });
});

it('serializes rapid edits without replacing the newest value with an earlier response', async () => {
  const access = useAccess();
  await access.load();
  let resolve!: (value: unknown) => void;
  vi.mocked(askNasShell).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  access.policy.value!.attempts = 3;
  const saving = access.save();
  access.policy.value!.attempts = 7;
  await access.save();
  resolve({ enabled: true, attempts: 3, lockMinutes: 1 });
  await saving;
  await flushPromises();
  expect(access.policy.value!.attempts).toBe(7);
  expect(askNasShell).toHaveBeenLastCalledWith('save-sign-in-policy', {
    enabled: true,
    attempts: 7,
    lockMinutes: 1,
  });
  expect(access.changed.value).toBe(false);
});
