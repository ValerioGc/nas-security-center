import { mount } from '@vue/test-utils';
import { beforeEach, expect, it } from 'vitest';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { setLocale } from '@/i18n';

beforeEach(() => setLocale('it'));

it('lists the five sections, marks the current one and changes it', async () => {
  const wrapper = mount(AppSidebar, { props: { modelValue: 'access' } });

  expect(wrapper.findAll('nav button').map((button) => button.text())).toEqual([
    'Accesso',
    'Dispositivi',
    'Antivirus',
    'Certificati',
    'Log di sicurezza',
  ]);
  expect(wrapper.get('[data-testid="section_access"]').attributes('aria-current')).toBe('page');
  expect(wrapper.get('[data-testid="section_logs"]').attributes('aria-current')).toBeUndefined();

  await wrapper.get('[data-testid="section_logs"]').trigger('click');
  expect(wrapper.emitted('update:modelValue')).toEqual([['logs']]);
});
