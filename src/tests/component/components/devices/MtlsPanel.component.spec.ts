import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import MtlsPanel from '@/components/devices/MtlsPanel.vue';
import { setLocale } from '@/i18n';
import { device, mtlsState } from '@/tests/fixtures/devices';
import type { MtlsState } from '@/types';

beforeEach(() => setLocale('it'));
afterEach(() => {
  document.body.innerHTML = '';
});

function panel(state: MtlsState, save = vi.fn(async () => undefined)) {
  return mount(MtlsPanel, { props: { state, save }, attachTo: document.body });
}

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

async function confirmWith(password: string) {
  const input = byTestId('password_confirm_input') as HTMLInputElement;
  input.value = password;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
  byTestId('password_confirm')?.dispatchEvent(new Event('submit'));
  await flushPromises();
}

it('asks the password before turning mTLS on, and saves with it', async () => {
  const save = vi.fn(async () => undefined);
  const wrapper = panel(mtlsState({ current: device({ current: true }) }), save);

  await wrapper.get('[data-testid="mtls_enabled"]').setValue(true);
  expect(document.querySelector('dialog')?.getAttribute('aria-label')).toBe(
    'Attiva accesso con certificato',
  );
  await confirmWith('secret');

  expect(save).toHaveBeenCalledWith(true, 'secret');
  expect(document.querySelector('dialog')).toBeNull();
  wrapper.unmount();
});

it('puts the switch back when the person steps back or the gateway refuses', async () => {
  const save = vi.fn(async () => {
    throw new Error('this device has no certificate of the NAS: install one first');
  });
  const wrapper = panel(mtlsState({ current: device({ current: true }) }), save);
  const input = wrapper.get<HTMLInputElement>('[data-testid="mtls_enabled"]');

  await input.setValue(true);
  await confirmWith('secret');
  expect(byTestId('password_confirm_error')?.textContent).toContain('non usa un certificato');

  document.querySelector<HTMLElement>('[aria-label="Chiudi"]')?.click();
  await flushPromises();
  expect(input.element.checked).toBe(false);
  wrapper.unmount();
});

it('follows the saved state and asks again to turn it off', async () => {
  const wrapper = panel(mtlsState());
  await wrapper.setProps({ state: mtlsState({ enabled: true }) });
  const input = wrapper.get<HTMLInputElement>('[data-testid="mtls_enabled"]');
  expect(input.element.checked).toBe(true);

  await input.setValue(false);
  expect(document.querySelector('dialog')?.getAttribute('aria-label')).toBe(
    'Disattiva accesso con certificato',
  );
  wrapper.unmount();
});

it('is locked without an authority on the gateway', () => {
  const wrapper = panel(mtlsState({ available: false }));

  expect(wrapper.get('[data-testid="mtls_enabled"]').attributes('disabled')).toBeDefined();
  expect(wrapper.text()).toContain('senza un’autorità di certificazione');
  wrapper.unmount();
});

it('lets certificate setup be selected without enforcing mTLS before the first certificate', async () => {
  const save = vi.fn(async () => undefined);
  const wrapper = panel(mtlsState(), save);
  await wrapper.get('[data-testid="mtls_enabled"]').setValue(true);
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
  expect(wrapper.find('[data-testid="mtls_setup"]').exists()).toBe(true);
  expect(document.querySelector('dialog')).toBeNull();
  expect(save).not.toHaveBeenCalled();
  wrapper.unmount();
});
