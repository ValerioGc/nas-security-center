import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import NewDeviceModal from '@/components/modals/NewDeviceModal.vue';
import { setLocale } from '@/i18n';
import { addDevice } from '@/services/devices';
import { CREDENTIAL, device } from '@/tests/fixtures/devices';

vi.mock('@/services/devices', () => ({ addDevice: vi.fn() }));

beforeEach(() => {
  setLocale('it');
  vi.mocked(addDevice).mockReset();
});
afterEach(() => {
  document.body.innerHTML = '';
});

function modal() {
  return mount(NewDeviceModal, { props: { modelValue: true }, attachTo: document.body });
}

it('asks for a name and the password, then shows the certificate of the new device', async () => {
  const added = device({ id: 2, name: 'Tablet', icon: 'phone' });
  vi.mocked(addDevice).mockResolvedValue({ device: added, credential: CREDENTIAL });
  const wrapper = modal();
  expect(wrapper.get('[data-testid="device_add"]').attributes('disabled')).toBeDefined();

  await wrapper.get('form').trigger('submit');
  expect(addDevice).not.toHaveBeenCalled();

  await wrapper.get('[data-testid="device_name"]').setValue(' Tablet ');
  await wrapper.get('[data-testid="device_icon_phone"]').trigger('click');
  await wrapper.get('[data-testid="device_password"]').setValue('secret');
  await wrapper.get('form').trigger('submit');
  await flushPromises();

  expect(addDevice).toHaveBeenCalledWith({ name: 'Tablet', icon: 'phone' }, 'secret');
  expect(wrapper.emitted('added')).toEqual([[added]]);
  expect(wrapper.get('dialog').attributes('aria-label')).toBe('Dispositivo aggiunto');
  expect(wrapper.get('[data-testid="credential_password"]').text()).toBe(CREDENTIAL.password);

  await wrapper.get('[data-testid="device_done"]').trigger('click');
  expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  wrapper.unmount();
});

it('says why the device was refused and forgets the password', async () => {
  vi.mocked(addDevice).mockRejectedValue(new Error('wrong password'));
  const wrapper = modal();

  await wrapper.get('[data-testid="device_name"]').setValue('Tablet');
  await wrapper.get('[data-testid="device_password"]').setValue('nope');
  await wrapper.get('form').trigger('submit');
  await flushPromises();

  expect(wrapper.get('[data-testid="device_add_error"]').text()).toBe('Password errata');
  expect(wrapper.get<HTMLInputElement>('[data-testid="device_password"]').element.value).toBe('');
  expect(wrapper.emitted('added')).toBeUndefined();
  wrapper.unmount();
});
