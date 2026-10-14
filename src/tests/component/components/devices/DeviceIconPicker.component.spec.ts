import { mount } from '@vue/test-utils';
import { beforeEach, expect, it } from 'vitest';
import DeviceIconPicker from '@/components/devices/DeviceIconPicker.vue';
import { setLocale } from '@/i18n';

beforeEach(() => setLocale('it'));

it('offers the five icons with their names and marks the chosen one', async () => {
  const wrapper = mount(DeviceIconPicker, { props: { modelValue: 'desktop' } });

  expect(wrapper.text()).toContain('PC fisso');
  expect(wrapper.text()).toContain('Proiettore');
  expect(wrapper.findAll('button')).toHaveLength(5);
  expect(wrapper.get('[data-testid="device_icon_desktop"]').attributes('aria-pressed')).toBe(
    'true',
  );

  await wrapper.get('[data-testid="device_icon_tv"]').trigger('click');
  expect(wrapper.emitted('update:modelValue')).toEqual([['tv']]);
});
