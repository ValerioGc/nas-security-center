import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DevicesPage from '@/components/sections/DevicesPage.vue';
import { setLocale } from '@/i18n';
import { askNasShell } from '@/services/nasShell';
import { CREDENTIAL, device, mtlsState } from '@/tests/fixtures/devices';

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
  answering({
    'mtls-state': mtlsState(),
    devices: [
      device(),
      device({ id: 2, name: 'Televisore', icon: 'tv', current: true, certificate: null }),
    ],
  });
});
afterEach(() => {
  document.body.innerHTML = '';
});

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

describe('the devices section', () => {
  it('lists the devices with their state and marks the one in use', async () => {
    const wrapper = mount(DevicesPage, { attachTo: document.body });
    await flushPromises();

    expect(wrapper.get('[data-testid="device_1"]').text()).toContain('Portatile in studio');
    expect(wrapper.get('[data-testid="device_1"]').text()).toContain('Attivo');
    expect(wrapper.get('[data-testid="device_1"]').text()).toContain('Ultimo accesso');
    expect(wrapper.get('[data-testid="device_2"]').text()).toContain('Questo dispositivo');
    expect(wrapper.get('[data-testid="device_2"]').text()).toContain('Mai collegato');
    expect(wrapper.find('[data-testid="mtls_panel"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('enables adding only while certificate access is selected, including the first device', async () => {
    answering({ 'mtls-state': mtlsState(), devices: [] });
    const wrapper = mount(DevicesPage, { attachTo: document.body });
    await flushPromises();
    expect(wrapper.get('[data-testid="device_new"]').attributes('disabled')).toBeDefined();
    await wrapper.get('[data-testid="mtls_enabled"]').setValue(true);
    expect(wrapper.get('[data-testid="device_new"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('[data-testid="mtls_setup"]').text()).toContain('certificato');
    expect(askNasShell).not.toHaveBeenCalledWith('save-mtls', expect.anything());
    await wrapper.get('[data-testid="mtls_enabled"]').setValue(false);
    expect(wrapper.get('[data-testid="device_new"]').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('says when no device is registered', async () => {
    answering({ 'mtls-state': mtlsState(), devices: [] });
    const wrapper = mount(DevicesPage, { attachTo: document.body });
    await flushPromises();

    expect(wrapper.get('[data-testid="devices_empty"]').text()).toBe(
      'Nessun dispositivo registrato',
    );
    wrapper.unmount();
  });

  it('says when the gateway does not answer and reads again on request', async () => {
    answering({ 'mtls-state': new Error('devices are unavailable'), devices: [] });
    const wrapper = mount(DevicesPage, { attachTo: document.body });
    await flushPromises();
    expect(wrapper.get('[data-testid="devices_error"]').text()).toContain(
      'Il gateway non risponde',
    );
    expect(wrapper.get('[data-testid="device_new"]').attributes('disabled')).toBeDefined();

    answering({ 'mtls-state': mtlsState(), devices: [] });
    await wrapper.get('[data-testid="devices_error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="devices_error"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('opens the details, shows a rename in the list, and drops a removed device', async () => {
    const wrapper = mount(DevicesPage, { attachTo: document.body });
    await flushPromises();

    await wrapper.get('[data-testid="device_1"]').trigger('click');
    expect(byTestId('device_details')).not.toBeNull();
    answering({ 'update-device': device({ name: 'Studio' }), 'remove-device': null });
    const name = byTestId('device_edit_name') as HTMLInputElement;
    name.value = 'Studio';
    name.dispatchEvent(new Event('input'));
    await flushPromises();
    byTestId('device_save')?.click();
    await flushPromises();
    expect(wrapper.get('[data-testid="device_1"]').text()).toContain('Studio');

    byTestId('device_remove')?.click();
    await flushPromises();
    byTestId('device_action_confirm')?.click();
    await flushPromises();
    expect(wrapper.find('[data-testid="device_1"]').exists()).toBe(false);
    expect(byTestId('device_details')).toBeNull();
    wrapper.unmount();
  });

  it('adds a device to the list once its certificate is issued', async () => {
    const wrapper = mount(DevicesPage, { attachTo: document.body });
    await flushPromises();
    answering({
      'add-device': { device: device({ id: 3, name: 'Tablet' }), credential: CREDENTIAL },
    });

    await wrapper.get('[data-testid="mtls_enabled"]').setValue(true);
    await wrapper.get('[data-testid="device_new"]').trigger('click');
    for (const [id, value] of [
      ['device_name', 'Tablet'],
      ['device_password', 'secret'],
    ]) {
      const input = byTestId(id!) as HTMLInputElement;
      input.value = value!;
      input.dispatchEvent(new Event('input'));
    }
    await flushPromises();
    byTestId('device_add')?.click();
    await flushPromises();

    expect(wrapper.get('[data-testid="device_3"]').text()).toContain('Tablet');
    expect(byTestId('credential')).not.toBeNull();
    wrapper.unmount();
  });
});
