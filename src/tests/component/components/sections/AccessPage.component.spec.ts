import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccessPage from '@/components/sections/AccessPage.vue';
import { askNasShell } from '@/services/nasShell';
import { setLocale } from '@/i18n';
import type { AccessRule } from '@/types';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));

const laptop: AccessRule = {
  id: '1',
  kind: 'ip',
  value: '192.168.1.20',
  label: 'Portatile',
  createdAt: 0,
};

let answers: Record<string, unknown>;

function answer(rules: AccessRule[] = []) {
  answers = {
    'access-settings': { notifyFailures: false },
    'access-rules': rules,
    'sign-in-policy': { enabled: true, attempts: 5, lockMinutes: 1 },
    'discovery-settings': { enabled: false },
  };
}

async function opened() {
  const wrapper = mount(AccessPage);
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  setLocale('it');
  answer();
  vi.mocked(askNasShell)
    .mockReset()
    .mockImplementation(async (type: string, payload?: unknown) => {
      const found = type in answers ? answers[type] : payload;
      if (found instanceof Error) {
        throw found;
      }
      return found as never;
    });
});

describe('the access section', () => {
  it('turns the discovery of NAS Finder on and off, and says why when refused', async () => {
    const wrapper = await opened();
    const discovery = wrapper.get('[data-testid="access_discovery"]');
    expect(discovery.text()).toContain('NAS Finder');
    expect(discovery.text()).toContain('rete locale');

    await wrapper.get('[data-testid="access_discovery_enabled"]').setValue(true);
    await flushPromises();
    expect(askNasShell).toHaveBeenCalledWith('save-discovery-settings', { enabled: true });
    expect(askNasShell).not.toHaveBeenCalledWith('save-access-settings', expect.anything());

    answers['save-discovery-settings'] = new Error('polkit refused');
    await wrapper.get('[data-testid="access_discovery_enabled"]').setValue(false);
    await flushPromises();
    expect(
      wrapper.get<HTMLInputElement>('[data-testid="access_discovery_enabled"]').element.checked,
    ).toBe(true);
    expect(wrapper.get('[data-testid="access_discovery_error"]').text()).toBe('polkit refused');
    wrapper.unmount();
  });

  it('saves changes immediately without adding a save row', async () => {
    const wrapper = await opened();
    expect(wrapper.findAll('input[type="number"]')).toHaveLength(2);
    expect(wrapper.find('[data-testid="access_save"]').exists()).toBe(false);
    await wrapper.get('[data-testid="access_notify"]').setValue(true);
    await flushPromises();
    expect(askNasShell).toHaveBeenCalledWith('save-access-settings', { notifyFailures: true });
    expect(wrapper.find('[data-testid="access_save"]').exists()).toBe(false);
    expect(wrapper.find('.save_row').exists()).toBe(false);
    wrapper.unmount();
  });

  it('sends the lock to the gateway, and greys its fields while it is off', async () => {
    const wrapper = await opened();
    expect(
      wrapper.get<HTMLInputElement>('[data-testid="access_lock_attempts"]').element.value,
    ).toBe('5');

    await wrapper.get('[data-testid="access_lock_minutes"]').setValue('0');
    expect(wrapper.find('[data-testid="access_save"]').exists()).toBe(false);
    await wrapper.get('[data-testid="access_lock_minutes"]').setValue('10');
    await wrapper.get('[data-testid="access_lock_attempts"]').setValue('3');
    await flushPromises();
    expect(askNasShell).toHaveBeenCalledWith('save-sign-in-policy', {
      enabled: true,
      attempts: 3,
      lockMinutes: 10,
    });

    await wrapper.get('[data-testid="access_lock_enabled"]').setValue(false);
    expect(
      wrapper.get('[data-testid="access_lock_attempts"]').attributes('disabled'),
    ).toBeDefined();
  });

  it('says so when the gateway does not answer', async () => {
    answers['sign-in-policy'] = new Error('down');
    const wrapper = await opened();

    expect(wrapper.find('[data-testid="access_lock_attempts"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="access_lock"]').text()).toContain(
      'Il gateway non è disponibile',
    );
  });

  it('says why the launcher could not be read, and tries again on request', async () => {
    answers['access-settings'] = new Error('Launcher unavailable');
    const wrapper = await opened();
    expect(wrapper.get('[data-testid="access_error"]').text()).toContain('Launcher unavailable');
    expect(wrapper.find('[data-testid="access_notify"]').exists()).toBe(false);

    answers['access-settings'] = { notifyFailures: true };
    await wrapper.get('[data-testid="access_error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="access_error"]').exists()).toBe(false);
    expect(wrapper.get<HTMLInputElement>('[data-testid="access_notify"]').element.checked).toBe(
      true,
    );
  });

  it('adds and removes an allowed address through the launcher', async () => {
    answers['add-access-rule'] = [laptop];
    answers['remove-access-rule'] = [];
    const wrapper = await opened();

    await wrapper.get('[data-testid="access_rule_open"]').trigger('click');
    await wrapper.get('[data-testid="access_rule_value"]').setValue('192.168.1.20');
    await wrapper.get('[data-testid="access_rule_form"]').trigger('submit');
    await flushPromises();
    expect(askNasShell).toHaveBeenCalledWith('add-access-rule', {
      kind: 'ip',
      value: '192.168.1.20',
      label: '',
    });
    expect(wrapper.get('[data-testid="access_rules_row_1"]').text()).toContain('192.168.1.20');
    expect(wrapper.find('[data-testid="access_rule_form"]').exists()).toBe(false);

    await wrapper.get('[aria-label="Rimuovi 192.168.1.20"]').trigger('click');
    await flushPromises();
    expect(askNasShell).toHaveBeenCalledWith('remove-access-rule', { id: '1' });
    expect(wrapper.text()).toContain('Nessuna regola di accesso configurata.');
  });
});
