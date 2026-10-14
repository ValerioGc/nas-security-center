import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '@/App.vue';
import { askNasShell } from '@/services/nasShell';
import { setLocale } from '@/i18n';

vi.mock('@/services/nasShell', () => ({
  askNasShell: vi.fn(),
  listenNasShell: vi.fn(() => () => undefined),
  readyNasShell: vi.fn(),
}));

beforeEach(() => {
  setLocale('it');
  vi.mocked(askNasShell)
    .mockReset()
    .mockImplementation(
      async (type: string) =>
        (
          ({
            'access-settings': { notifyFailures: false },
            'access-rules': [],
            'sign-in-policy': { enabled: true, attempts: 5, lockMinutes: 1 },
            'refused-sign-ins': [],
            'mtls-state': { enabled: false, available: true, current: null },
            devices: [],
          }) as Record<string, unknown>
        )[type] as never,
    );
});

it('opens on the access and moves between the sections from the sidebar', async () => {
  const wrapper = mount(App);
  await flushPromises();
  expect(wrapper.get('h1').text()).toBe('Accesso');

  await wrapper.get('[data-testid="section_devices"]').trigger('click');
  expect(wrapper.get('h1').text()).toBe('Dispositivi');

  await wrapper.get('[data-testid="section_logs"]').trigger('click');
  await flushPromises();
  expect(wrapper.get('h1').text()).toBe('Log di sicurezza');
  expect(askNasShell).toHaveBeenCalledWith('refused-sign-ins');
});

it('opens on the section the launcher asks for, and on the access for one it does not know', async () => {
  window.history.replaceState(null, '', '/?section=devices');
  const devices = mount(App);
  await flushPromises();
  expect(devices.get('h1').text()).toBe('Dispositivi');
  devices.unmount();

  window.history.replaceState(null, '', '/?section=nowhere');
  const unknown = mount(App);
  await flushPromises();
  expect(unknown.get('h1').text()).toBe('Accesso');
  unknown.unmount();
  window.history.replaceState(null, '', '/');
});
