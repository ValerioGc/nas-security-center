import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CredentialPanel from '@/components/devices/CredentialPanel.vue';
import { setLocale } from '@/i18n';
import { CREDENTIAL } from '@/tests/fixtures/devices';
import { saveFile } from '@/utils/saveFile';

vi.mock('@/utils/saveFile', async (original) => ({
  ...(await original<typeof import('@/utils/saveFile')>()),
  saveFile: vi.fn(),
}));

beforeEach(() => setLocale('it'));
afterEach(() => vi.mocked(saveFile).mockReset());

it('shows the password once and saves the file of the device', async () => {
  const wrapper = mount(CredentialPanel, { props: { credential: CREDENTIAL } });

  expect(wrapper.get('[data-testid="credential_password"]').text()).toBe(CREDENTIAL.password);
  await wrapper.get('[data-testid="credential_download"]').trigger('click');

  const [bytes, name, type] = vi.mocked(saveFile).mock.calls[0]!;
  expect(new TextDecoder().decode(bytes as Uint8Array)).toBe('p12');
  expect(name).toBe('nas-os-tablet.p12');
  expect(type).toBe('application/x-pkcs12');
});

it('offers the authority of the NAS from the gateway', () => {
  const wrapper = mount(CredentialPanel, { props: { credential: CREDENTIAL } });
  const authority = wrapper.get('[data-testid="credential_authority"]');

  expect(authority.attributes('href')).toBe('/auth/ca.crt');
  expect(authority.attributes('download')).toBe('nas-os-ca.crt');
});
