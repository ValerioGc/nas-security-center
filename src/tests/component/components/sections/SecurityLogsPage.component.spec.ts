import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SecurityLogsPage from '@/components/sections/SecurityLogsPage.vue';
import { askNasShell } from '@/services/nasShell';
import { setLocale } from '@/i18n';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));

let answers: Record<string, unknown>;

beforeEach(() => {
  setLocale('it');
  answers = {
    'refused-sign-ins': [
      { id: '1', at: Date.UTC(2026, 9, 1, 8), from: '192.168.1.9', field: 'password' },
      { id: '2', at: Date.UTC(2026, 9, 2, 8), from: '', field: 'username' },
      { id: '3', at: Date.UTC(2026, 8, 30, 8), from: '10.0.0.4', field: 'token' },
    ],
    'access-settings': { notifyFailures: true },
  };
  vi.mocked(askNasShell)
    .mockReset()
    .mockImplementation(async (type: string) => {
      const found = answers[type];
      if (found instanceof Error) {
        throw found;
      }
      return found as never;
    });
});

describe('the security log', () => {
  it('lists the refused sign-ins, newest first, with the wrong field in words', async () => {
    const wrapper = mount(SecurityLogsPage);
    await flushPromises();

    const rows = wrapper.findAll('tbody tr').map((row) => row.text());
    expect(rows[0]).toContain('Nome utente');
    expect(rows[0]).toContain('-');
    expect(rows[1]).toContain('192.168.1.9');
    expect(rows[1]).toContain('Password');
    expect(rows[2]).toContain('token');
    expect(wrapper.find('[data-testid="logs_recording_off"]').exists()).toBe(false);
  });

  it('says when nothing is refused, and when nothing is being recorded', async () => {
    answers = { 'refused-sign-ins': [], 'access-settings': { notifyFailures: false } };
    const wrapper = mount(SecurityLogsPage);
    await flushPromises();

    expect(wrapper.get('[data-testid="logs_empty"]').text()).toBe('Nessun accesso rifiutato.');
    expect(wrapper.get('[data-testid="logs_refresh"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-testid="logs_recording_off"]').text()).toContain('sezione Accesso');
  });

  it('says why the launcher could not be read, and reads again on request', async () => {
    answers['refused-sign-ins'] = new Error('Launcher unavailable');
    const wrapper = mount(SecurityLogsPage);
    await flushPromises();
    expect(wrapper.get('[data-testid="logs_error"]').text()).toContain('Launcher unavailable');

    answers['refused-sign-ins'] = [];
    await wrapper.get('[data-testid="logs_error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="logs_error"]').exists()).toBe(false);
    expect(askNasShell).toHaveBeenCalledTimes(4);
  });
});
