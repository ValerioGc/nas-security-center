import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, expect, it } from 'vitest';
import CustomCertificate from '@/components/certificates/CustomCertificate.vue';
import { setLocale } from '@/i18n';

beforeEach(() => setLocale('it'));

async function choose(
  input: { element: Element; trigger: (event: string) => Promise<void> },
  file: File,
) {
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
}

it('uploads the certificate and its key once both are chosen', async () => {
  const wrapper = mount(CustomCertificate);
  const upload = wrapper.get('[data-testid="custom_upload"]');
  expect(upload.attributes('disabled')).toBeDefined();

  await choose(
    wrapper.get('[data-testid="custom_certificate_file"]'),
    new File(['CERT'], 'nas.crt'),
  );
  expect(upload.attributes('disabled')).toBeDefined();
  await choose(wrapper.get('[data-testid="custom_key_file"]'), new File(['KEY'], 'nas.key'));
  await upload.trigger('click');
  await flushPromises();
  expect(wrapper.emitted('upload')?.[0]).toEqual(['CERT', 'KEY']);
});

it('refuses a file larger than the gateway takes', async () => {
  const wrapper = mount(CustomCertificate);
  await choose(
    wrapper.get('[data-testid="custom_certificate_file"]'),
    new File(['x'.repeat(61 * 1024)], 'big.crt'),
  );
  await choose(wrapper.get('[data-testid="custom_key_file"]'), new File(['KEY'], 'nas.key'));
  expect(wrapper.get('[data-testid="custom_upload"]').attributes('disabled')).toBeDefined();
});
