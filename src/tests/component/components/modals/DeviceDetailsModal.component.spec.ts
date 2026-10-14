import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeviceDetailsModal from '@/components/modals/DeviceDetailsModal.vue';
import { setLocale } from '@/i18n';
import { removeDevice, renewDevice, revokeDevice, updateDevice } from '@/services/devices';
import { CREDENTIAL, device } from '@/tests/fixtures/devices';
import type { Device } from '@/types';

vi.mock('@/services/devices', () => ({
  removeDevice: vi.fn(),
  renewDevice: vi.fn(),
  revokeDevice: vi.fn(),
  updateDevice: vi.fn(),
}));

beforeEach(() => {
  setLocale('it');
  vi.clearAllMocks();
});
afterEach(() => {
  document.body.innerHTML = '';
});

function details(shown: Device = device(), mtlsEnabled = false) {
  return mount(DeviceDetailsModal, {
    props: { modelValue: true, device: shown, mtlsEnabled },
    attachTo: document.body,
  });
}

const title = (wrapper: ReturnType<typeof details>) =>
  wrapper.get('dialog').attributes('aria-label');

describe('the details of a device', () => {
  it('shows the certificate with its fingerprint and dates', () => {
    const wrapper = details();
    const text = wrapper.get('[data-testid="device_certificate"]').text();

    expect(title(wrapper)).toBe('Dettagli del dispositivo');
    expect(text).toContain('Attivo');
    expect(text).toContain(`AB:AB:AB`);
    expect(text).toContain('02/10/26');
    expect(wrapper.find('[data-testid="device_save"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('says when a device has no certificate and was never seen', () => {
    const wrapper = details(device({ certificate: null }));

    expect(wrapper.get('[data-testid="device_certificate"]').text()).toContain('Senza certificato');
    expect(wrapper.get('[data-testid="device_revoke"]').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('renames the device and changes its icon', async () => {
    const renamed = device({ name: 'Studio', icon: 'desktop' });
    vi.mocked(updateDevice).mockResolvedValue(renamed);
    const wrapper = details();

    await wrapper.get('[data-testid="device_edit_name"]').setValue(' Studio ');
    await wrapper.get('[data-testid="device_icon_desktop"]').trigger('click');
    await wrapper.get('[data-testid="device_save"]').trigger('submit');
    await flushPromises();

    expect(updateDevice).toHaveBeenCalledWith(1, { name: 'Studio', icon: 'desktop' });
    expect(wrapper.emitted('changed')).toEqual([[renamed]]);
    wrapper.unmount();
  });

  it('renews the certificate with the password and shows the new one', async () => {
    const renewed = device({ certificate: { ...device().certificate!, state: 'pending' } });
    vi.mocked(renewDevice).mockResolvedValue({ device: renewed, credential: CREDENTIAL });
    const wrapper = details();

    await wrapper.get('[data-testid="device_renew"]').trigger('click');
    expect(title(wrapper)).toBe('Rinnova certificato');
    await wrapper.get('[data-testid="password_confirm_input"]').setValue('secret');
    await wrapper.get('[data-testid="password_confirm"]').trigger('submit');
    await flushPromises();

    expect(renewDevice).toHaveBeenCalledWith(1, 'secret');
    expect(wrapper.emitted('changed')).toEqual([[renewed]]);
    expect(title(wrapper)).toBe('Certificato rinnovato');
    expect(wrapper.get('[data-testid="credential_password"]').text()).toBe(CREDENTIAL.password);

    await wrapper.get('[data-testid="device_renew_done"]').trigger('click');
    expect(wrapper.find('[data-testid="device_details"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('keeps the renewal open with the reason when the password is wrong', async () => {
    vi.mocked(renewDevice).mockRejectedValue(new Error('wrong password'));
    const wrapper = details();

    await wrapper.get('[data-testid="device_renew"]').trigger('click');
    await wrapper.get('[data-testid="password_confirm_input"]').setValue('nope');
    await wrapper.get('[data-testid="password_confirm"]').trigger('submit');
    await flushPromises();

    expect(wrapper.get('[data-testid="password_confirm_error"]').text()).toBe('Password errata');
    await wrapper.get('[data-testid="password_confirm"] button[type="button"]').trigger('click');
    expect(wrapper.find('[data-testid="device_details"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('revokes the certificate after asking', async () => {
    const revoked = device({ certificate: { ...device().certificate!, state: 'revoked' } });
    vi.mocked(revokeDevice).mockResolvedValue(revoked);
    const wrapper = details();

    await wrapper.get('[data-testid="device_revoke"]').trigger('click');
    expect(title(wrapper)).toBe('Revoca certificato');
    await wrapper.get('[data-testid="device_action_confirm"]').trigger('click');
    await flushPromises();

    expect(revokeDevice).toHaveBeenCalledWith(1);
    expect(wrapper.emitted('changed')).toEqual([[revoked]]);
    wrapper.unmount();
  });

  it('removes the device after asking and closes', async () => {
    vi.mocked(removeDevice).mockResolvedValue(null);
    const wrapper = details();

    await wrapper.get('[data-testid="device_remove"]').trigger('click');
    expect(title(wrapper)).toBe('Rimuovi dispositivo');
    await wrapper.get('[data-testid="device_action_confirm"]').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('removed')).toEqual([[1]]);
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    wrapper.unmount();
  });

  it('stays on the question with the reason when the gateway refuses', async () => {
    vi.mocked(removeDevice).mockRejectedValue(
      new Error('this is the device in use: act on it from another one'),
    );
    const wrapper = details();

    await wrapper.get('[data-testid="device_remove"]').trigger('click');
    await wrapper.get('[data-testid="device_action_confirm"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="device_action_error"]').text()).toContain(
      'Dispositivo in uso',
    );
    await wrapper.get('.action_button:not(.danger)').trigger('click');
    expect(wrapper.find('[data-testid="device_details"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('locks the actions on the device in use while mTLS is on', () => {
    const wrapper = details(device({ current: true }), true);

    expect(wrapper.text()).toContain('Questo dispositivo');
    expect(wrapper.get('[data-testid="device_locked"]').text()).toContain('Dispositivo in uso');
    for (const action of ['device_renew', 'device_revoke', 'device_remove']) {
      expect(wrapper.get(`[data-testid="${action}"]`).attributes('disabled')).toBeDefined();
    }
    wrapper.unmount();
  });
});
