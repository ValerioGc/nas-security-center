import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import OperationProgress from '@/components/antivirus/OperationProgress.vue';

it('shows how far an operation is, rounded and kept within the bar', async () => {
  const wrapper = mount(OperationProgress, {
    props: { label: 'Progress', phase: 'Scanning…', progress: 41.6, detail: 'Files: 12' },
  });
  const bar = wrapper.get('progress');
  expect(bar.attributes('aria-label')).toBe('Progress');
  expect(bar.attributes('aria-valuenow')).toBe('42');
  expect(wrapper.get('.operation_percent').text()).toBe('42%');
  expect(bar.attributes('value')).toBe('42');
  expect(bar.attributes('max')).toBe('100');
  expect(wrapper.get('.operation_detail').text()).toBe('Files: 12');
  await wrapper.setProps({ progress: 140 });
  expect(bar.attributes('aria-valuenow')).toBe('100');
});

it('shows a spinner without a misleading bar when progress is unknown', () => {
  const wrapper = mount(OperationProgress, {
    props: { label: 'Progress', phase: 'Installing…', progress: null },
  });
  expect(wrapper.find('progress').exists()).toBe(false);
  expect(wrapper.find('.operation_spinner').exists()).toBe(true);
  expect(wrapper.find('.operation_percent').exists()).toBe(false);
  expect(wrapper.find('.operation_detail').exists()).toBe(false);
});
