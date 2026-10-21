import { expect, it } from 'vitest';
import { validCertificateName } from '@/utils/certificateName';

it('accepts the addresses the gateway issues a certificate for, and nothing else', () => {
  for (const name of ['nas.example.org', '*.example.org', 'nas', '10.8.0.2', 'fe80::1']) {
    expect(validCertificateName(name), name).toBe(true);
  }
  for (const name of ['', 'bad name', '-nas.example', 'nas..example', '300.1.1.1', 'a/b']) {
    expect(validCertificateName(name), name).toBe(false);
  }
});
