import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CertificatesPage from '@/components/sections/CertificatesPage.vue';
import CustomCertificate from '@/components/certificates/CustomCertificate.vue';
import { setLocale } from '@/i18n';
import { askNasShell, shell } from '@/services/nasShell';
import { details, serverCertificate } from '@/tests/fixtures/certificates';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn(), shell: { openHttps: vi.fn() } }));

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

beforeEach(() => {
  setLocale('it');
  vi.mocked(askNasShell).mockReset().mockResolvedValue(serverCertificate());
});
afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

function over(protocol: string, hostname: string) {
  vi.stubGlobal('location', { protocol, hostname, pathname: '/apps/nas-security-center/' });
}

async function confirmWith(password: string) {
  const input = byTestId('password_confirm_input') as HTMLInputElement;
  input.value = password;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
  byTestId('password_confirm_submit')?.click();
  await flushPromises();
}

describe('the certificates section', () => {
  it('shows the certificate in use, the addresses and the authority', async () => {
    const wrapper = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    expect(askNasShell).toHaveBeenCalledWith('certificate');
    for (const part of [
      'active_certificate',
      'certificate_extra_names',
      'custom_certificate',
      'certificate_authority',
    ]) {
      expect(byTestId(part), part).not.toBeNull();
    }
    // The tests run on http://localhost: a plain connection is what the page warns about first.
    expect(byTestId('certificate_plain')?.textContent).toContain('HTTP');
    byTestId('certificate_open_https')?.click();
    expect(shell.openHttps).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('says when HTTPS is not served at all', async () => {
    vi.mocked(askNasShell).mockResolvedValue(serverCertificate({ served: false }));
    const wrapper = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    expect(byTestId('certificate_https_off')).not.toBeNull();
    wrapper.unmount();
  });

  it('issues a new certificate once the password is confirmed', async () => {
    const wrapper = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    byTestId('certificate_renew')?.click();
    await flushPromises();
    vi.mocked(askNasShell).mockResolvedValue(
      serverCertificate({ active: details({ fingerprint: 'cd'.repeat(32) }) }),
    );
    await confirmWith('secret');
    expect(askNasShell).toHaveBeenLastCalledWith(
      'renew-certificate',
      { password: 'secret' },
      30000,
    );
    expect(byTestId('password_confirm')).toBeNull();
    expect(wrapper.text()).toContain('cd'.repeat(32));
    wrapper.unmount();
  });

  it('keeps the window open with the reason when the gateway refuses', async () => {
    const wrapper = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    byTestId('extra_name_input')?.setAttribute('value', '');
    const input = byTestId('extra_name_input') as HTMLInputElement;
    input.value = 'nas.example.org';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    byTestId('extra_name_add')?.click();
    await flushPromises();
    byTestId('extra_names_save')?.click();
    await flushPromises();
    vi.mocked(askNasShell).mockRejectedValue(new Error('wrong password'));
    await confirmWith('wrong');
    expect(askNasShell).toHaveBeenLastCalledWith(
      'save-certificate-names',
      { names: ['nas.example.org'], password: 'wrong' },
      30000,
    );
    expect(byTestId('password_confirm_error')).not.toBeNull();
    wrapper.unmount();
  });

  it('goes back to the NAS certificate when a custom one is in use', async () => {
    vi.mocked(askNasShell).mockResolvedValue(serverCertificate({ custom: true }));
    const wrapper = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    byTestId('certificate_restore')?.click();
    await flushPromises();
    vi.mocked(askNasShell).mockResolvedValue(serverCertificate());
    await confirmWith('secret');
    expect(askNasShell).toHaveBeenLastCalledWith(
      'remove-custom-certificate',
      { password: 'secret' },
      30000,
    );
    wrapper.unmount();
  });

  it('can retry a failed read', async () => {
    vi.mocked(askNasShell).mockRejectedValueOnce(new Error('Launcher unavailable'));
    const wrapper = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    expect(byTestId('certificates_error')).not.toBeNull();
    (byTestId('certificates_error')?.querySelector('button') as HTMLElement).click();
    await flushPromises();
    expect(byTestId('active_certificate')).not.toBeNull();
    wrapper.unmount();
  });

  it('over HTTPS, says whether the address of the page is covered', async () => {
    over('https:', 'nas.local');
    const covered = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    expect(byTestId('certificate_covered')?.textContent).toContain('nas.local');
    covered.unmount();

    over('https:', 'nas.example.org');
    const missing = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    expect(byTestId('certificate_not_covered')?.textContent).toContain('nas.example.org');
    missing.unmount();
  });

  it('uploads a custom certificate with the password, and the window can be closed', async () => {
    const wrapper = mount(CertificatesPage, { attachTo: document.body });
    await flushPromises();
    wrapper.findComponent(CustomCertificate).vm.$emit('upload', 'CERT', 'KEY');
    await flushPromises();
    expect(byTestId('password_confirm')).not.toBeNull();
    (
      document.querySelector(
        '[data-testid="password_confirm"] button[type="button"]',
      ) as HTMLElement
    ).click();
    await flushPromises();
    expect(byTestId('password_confirm')).toBeNull();

    wrapper.findComponent(CustomCertificate).vm.$emit('upload', 'CERT', 'KEY');
    await flushPromises();
    vi.mocked(askNasShell).mockResolvedValue(serverCertificate({ custom: true }));
    await confirmWith('secret');
    expect(askNasShell).toHaveBeenLastCalledWith(
      'upload-certificate',
      { certificate: 'CERT', key: 'KEY', password: 'secret' },
      30000,
    );
    expect(byTestId('certificate_source')?.textContent).toContain('Personalizzato');
    wrapper.unmount();
  });
});
