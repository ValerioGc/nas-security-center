import { mount } from '@vue/test-utils';
import { beforeEach, expect, it } from 'vitest';
import ActiveCertificate from '@/components/certificates/ActiveCertificate.vue';
import { setLocale } from '@/i18n';
import { details } from '@/tests/fixtures/certificates';

beforeEach(() => setLocale('it'));

it('shows the certificate of the NAS and offers to issue a new one', async () => {
  const wrapper = mount(ActiveCertificate, { props: { certificate: details(), custom: false } });
  expect(wrapper.get('[data-testid="certificate_source"]').text()).toBe('Del NAS');
  expect(wrapper.findAll('[data-testid="certificate_names"] li').map((li) => li.text())).toEqual([
    'nas',
    'nas.local',
    'localhost',
    '127.0.0.1',
  ]);
  expect(wrapper.text()).toContain('nas-os NAS authority');
  await wrapper.get('[data-testid="certificate_renew"]').trigger('click');
  expect(wrapper.emitted('renew')).toHaveLength(1);
  expect(wrapper.find('[data-testid="certificate_restore"]').exists()).toBe(false);
});

it('offers to go back to the NAS certificate when a custom one is in use', async () => {
  const wrapper = mount(ActiveCertificate, {
    props: { certificate: details({ issuer: 'R11' }), custom: true },
  });
  expect(wrapper.get('[data-testid="certificate_source"]').text()).toBe('Personalizzato');
  await wrapper.get('[data-testid="certificate_restore"]').trigger('click');
  expect(wrapper.emitted('restore')).toHaveLength(1);
});
