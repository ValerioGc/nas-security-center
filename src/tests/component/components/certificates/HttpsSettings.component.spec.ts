import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import HttpsSettings from '@/components/certificates/HttpsSettings.vue';
import { setLocale } from '@/i18n';
import { askNasShell } from '@/services/nasShell';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));

beforeEach(() => {
  setLocale('it');
  vi.mocked(askNasShell).mockReset().mockResolvedValue({ port: 443, force: false });
});
afterEach(() => {
  document.body.innerHTML = '';
});

async function confirm() {
  const input = document.querySelector<HTMLInputElement>('[data-testid="password_confirm_input"]')!;
  input.value = 'secret';
  input.dispatchEvent(new Event('input'));
  await flushPromises();
  document
    .querySelector<HTMLFormElement>('[data-testid="password_confirm"]')!
    .dispatchEvent(new Event('submit'));
  await flushPromises();
}

it('loads the saved port and slider and requires a change before saving', async () => {
  vi.mocked(askNasShell).mockResolvedValue({ port: 8443, force: true });
  const wrapper = mount(HttpsSettings);
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('https-settings');
  expect(wrapper.get<HTMLInputElement>('[data-testid="https_port"]').element.value).toBe('8443');
  expect(wrapper.get<HTMLInputElement>('[data-testid="force_https"]').element.checked).toBe(true);
  expect(wrapper.get('[data-testid="https_save"]').attributes('disabled')).toBeDefined();
  wrapper.unmount();
});

it('confirms the password and saves connection settings without renewing the certificate', async () => {
  const wrapper = mount(HttpsSettings, { attachTo: document.body });
  await flushPromises();
  await wrapper.get('[data-testid="https_port"]').setValue('8443');
  await wrapper.get('[data-testid="force_https"]').setValue(true);
  await wrapper.get('form').trigger('submit');
  expect(askNasShell).toHaveBeenCalledTimes(1);
  expect(document.querySelector('dialog')?.textContent).toContain(
    'Il certificato rimane invariato',
  );
  vi.mocked(askNasShell).mockResolvedValue({ port: 8443, force: true });
  await confirm();
  expect(askNasShell).toHaveBeenLastCalledWith(
    'save-https-settings',
    { port: 8443, force: true, password: 'secret' },
    30000,
  );
  expect(askNasShell).toHaveBeenCalledTimes(2);
  expect(document.querySelector('dialog')).toBeNull();
  expect(wrapper.get('[data-testid="https_save"]').attributes('disabled')).toBeDefined();
  wrapper.unmount();
});

it('rejects empty, fractional and out of range ports', async () => {
  const wrapper = mount(HttpsSettings);
  await flushPromises();
  for (const value of ['', '0', '65536', '1.5']) {
    await wrapper.get('[data-testid="https_port"]').setValue(value);
    expect(wrapper.get('[data-testid="https_save"]').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('tra 1 e 65535');
  }
  wrapper.unmount();
});

it('keeps the draft and password window when the port is occupied', async () => {
  const wrapper = mount(HttpsSettings, { attachTo: document.body });
  await flushPromises();
  await wrapper.get('[data-testid="https_port"]').setValue('8443');
  await wrapper.get('form').trigger('submit');
  vi.mocked(askNasShell).mockRejectedValue(
    new Error('the HTTPS port is already in use or unavailable'),
  );
  await confirm();
  expect(document.querySelector('[data-testid="password_confirm_error"]')?.textContent).toContain(
    'già occupata',
  );
  expect(wrapper.get<HTMLInputElement>('[data-testid="https_port"]').element.value).toBe('8443');
  wrapper.unmount();
});

it('lets the settings be loaded again after an error', async () => {
  vi.mocked(askNasShell).mockRejectedValueOnce(new Error('offline'));
  const wrapper = mount(HttpsSettings);
  await flushPromises();
  expect(wrapper.text()).toContain('offline');
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(wrapper.get<HTMLInputElement>('[data-testid="https_port"]').element.disabled).toBe(false);
  wrapper.unmount();
});
