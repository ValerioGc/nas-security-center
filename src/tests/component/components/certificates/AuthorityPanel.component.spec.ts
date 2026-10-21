import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, expect, it } from 'vitest';
import AuthorityPanel from '@/components/certificates/AuthorityPanel.vue';
import { setLocale } from '@/i18n';
import { details } from '@/tests/fixtures/certificates';

beforeEach(() => setLocale('en'));

it('offers the authority with its fingerprint and how to trust it on every platform', () => {
  const wrapper = mount(AuthorityPanel, { props: { authority: details() } });
  expect(wrapper.get('[data-testid="authority_download"]').attributes('href')).toBe('/auth/ca.crt');
  expect(wrapper.text()).toContain('ab'.repeat(32));
  expect(wrapper.findAll('[role="tab"]')).toHaveLength(6);
  const steps = () => wrapper.findAll('[role="tabpanel"] li').map((step) => step.text());
  expect(steps()).toHaveLength(4);
  expect(steps()[2]).toContain('Trusted Root Certification Authorities');
});

it('shows the steps of the system chosen, also with the arrows', async () => {
  const wrapper = mount(AuthorityPanel, {
    props: { authority: details() },
    attachTo: document.body,
  });
  const tab = (platform: string) => wrapper.get(`[data-testid="trust_${platform}"]`);
  await tab('ios').trigger('click');
  expect(tab('ios').attributes('aria-selected')).toBe('true');
  expect(wrapper.get('[role="tabpanel"]').text()).toContain('Certificate Trust Settings');
  await tab('ios').trigger('keydown', { key: 'ArrowRight' });
  await flushPromises();
  expect(tab('windows').attributes('aria-selected')).toBe('true');
  expect(document.activeElement).toBe(tab('windows').element);
  await tab('windows').trigger('keydown', { key: 'ArrowLeft' });
  expect(tab('ios').attributes('aria-selected')).toBe('true');
  wrapper.unmount();
});
