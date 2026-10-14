import { beforeEach, expect, it, vi } from 'vitest';
import {
  readCertificate,
  removeCustomCertificate,
  renewCertificate,
  saveCertificateNames,
  uploadCertificate,
} from '@/services/certificates';
import { askNasShell } from '@/services/nasShell';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));

beforeEach(() => vi.mocked(askNasShell).mockReset().mockResolvedValue(null));

it('asks the shell for each request, with more time where the password is checked', async () => {
  await readCertificate();
  await saveCertificateNames(['nas.example.org'], 'secret');
  await renewCertificate('secret');
  await uploadCertificate('CERT', 'KEY', 'secret');
  await removeCustomCertificate('secret');

  expect(vi.mocked(askNasShell).mock.calls).toEqual([
    ['certificate'],
    ['save-certificate-names', { names: ['nas.example.org'], password: 'secret' }, 30000],
    ['renew-certificate', { password: 'secret' }, 30000],
    ['upload-certificate', { certificate: 'CERT', key: 'KEY', password: 'secret' }, 30000],
    ['remove-custom-certificate', { password: 'secret' }, 30000],
  ]);
});
