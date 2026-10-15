import { mount } from '@vue/test-utils';
import { beforeEach, expect, it } from 'vitest';
import CertificateNames from '@/components/certificates/CertificateNames.vue';
import { setLocale } from '@/i18n';

beforeEach(() => setLocale('it'));

function mountNames(extra: string[] = []) {
  return mount(CertificateNames, {
    props: { extra, custom: false },
  });
}

it('adds valid addresses, refuses the others and saves the list', async () => {
  const wrapper = mountNames(['old.example.org']);
  expect(wrapper.find('[data-testid="automatic_names"]').exists()).toBe(false);
  const save = wrapper.get('[data-testid="extra_names_save"]');
  expect(save.attributes('disabled')).toBeDefined();

  await wrapper.get('[data-testid="extra_name_input"]').setValue('bad name');
  expect(wrapper.get('[role="alert"]').text()).toContain('Indirizzo non valido');
  expect(wrapper.get('[data-testid="extra_name_add"]').attributes('disabled')).toBeDefined();

  await wrapper.get('[data-testid="extra_name_input"]').setValue(' NAS.Example.org ');
  await wrapper.get('form').trigger('submit');
  await wrapper.get('[data-testid="extra_name_input"]').setValue('nas.example.org');
  await wrapper.get('form').trigger('submit');
  await wrapper.get('[aria-label="Rimuovi old.example.org"]').trigger('click');
  await save.trigger('click');
  expect(wrapper.emitted('save')?.[0]).toEqual([['nas.example.org']]);
});

it('says the additional addresses apply to the NAS certificate while a custom one is in use', () => {
  const wrapper = mount(CertificateNames, {
    props: { extra: [], custom: true },
  });
  expect(wrapper.find('[data-testid="certificate_custom_note"]').exists()).toBe(true);
});
