import { flushPromises } from '@vue/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';
import { covers, useCertificate } from '@/composables/useCertificate';
import { setLocale } from '@/i18n';
import { readCertificate } from '@/services/certificates';
import { details, serverCertificate } from '@/tests/fixtures/certificates';

vi.mock('@/services/certificates', () => ({ readCertificate: vi.fn() }));

beforeEach(() => {
  setLocale('en');
  vi.mocked(readCertificate).mockReset();
});

it('knows which addresses a certificate covers, a wildcard one level down only', () => {
  expect(covers(['NAS.local', '10.0.0.2'], 'nas.local')).toBe(true);
  expect(covers(['10.0.0.2'], '10.0.0.3')).toBe(false);
  expect(covers(['*.example.org'], 'nas.example.org')).toBe(true);
  expect(covers(['*.example.org'], 'a.b.example.org')).toBe(false);
  expect(covers(['*.example.org'], 'example.org')).toBe(false);
});

it('reads the state and says whether the address of the page is covered', async () => {
  vi.mocked(readCertificate).mockResolvedValue(
    serverCertificate({ active: details({ names: ['nas.example.org'] }) }),
  );
  const certificate = useCertificate();
  expect(certificate.covered.value).toBe(true);
  await certificate.load();
  await flushPromises();
  expect(certificate.host).toBe('localhost');
  expect(certificate.covered.value).toBe(false);

  await certificate.apply(async () => serverCertificate());
  expect(certificate.covered.value).toBe(true);
});

it('keeps the reason a read failed', async () => {
  vi.mocked(readCertificate).mockRejectedValue(new Error('Launcher unavailable'));
  const certificate = useCertificate();
  await certificate.load();
  expect(certificate.error.value).not.toBe('');
  expect(certificate.loading.value).toBe(false);
});
