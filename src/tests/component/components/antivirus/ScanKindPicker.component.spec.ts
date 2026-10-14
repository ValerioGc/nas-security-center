import { mount } from '@vue/test-utils';
import { beforeEach, expect, it } from 'vitest';
import ScanKindPicker from '@/components/antivirus/ScanKindPicker.vue';
import { setLocale } from '@/i18n';
import type { ScanKind } from '@/types';

beforeEach(() => setLocale('it'));

it('offers every kind of scan as a card, one chosen at a time', async () => {
  const wrapper = mount(ScanKindPicker, {
    props: {
      modelValue: 'quick' as ScanKind,
      'onUpdate:modelValue': (value: ScanKind) => wrapper.setProps({ modelValue: value }),
    },
  });
  expect(wrapper.findAll('.scan_kind strong').map((title) => title.text())).toEqual([
    'Rapida',
    'Totale',
    'File',
    'Personalizzata',
  ]);
  expect(wrapper.get('.scan_kind--chosen').text()).toContain('Rapida');
  await wrapper.get('[data-testid="antivirus_kind_file"] input').setValue(true);
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['file']);
  expect(wrapper.findAll('.scan_kind--chosen')).toHaveLength(1);
  expect(wrapper.get('.scan_kind--chosen').text()).toContain('File');
  await wrapper.setProps({ disabled: true });
  expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined();
});
