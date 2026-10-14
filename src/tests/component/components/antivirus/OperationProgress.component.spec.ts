import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import OperationProgress from '@/components/antivirus/OperationProgress.vue';

it('shows how far an operation is, rounded and kept within the bar', async () => {
  const wrapper = mount(OperationProgress, {
    props: { label: 'Progress', phase: 'Scanning…', progress: 41.6, detail: 'Files: 12' },
  });
  const bar = wrapper.get('[role="progressbar"]');
  expect(bar.attributes('aria-label')).toBe('Progress');
  expect(bar.attributes('aria-valuenow')).toBe('42');
  expect(wrapper.get('.operation_percent').text()).toBe('42%');
  expect(wrapper.get('.operation_fill').attributes('style')).toContain('width: 42%');
  expect(wrapper.get('.operation_detail').text()).toBe('Files: 12');
  await wrapper.setProps({ progress: 140 });
  expect(bar.attributes('aria-valuenow')).toBe('100');
});

it('runs a stripe along the track when it cannot tell how far it is', () => {
  const wrapper = mount(OperationProgress, {
    props: { label: 'Progress', phase: 'Installing…', progress: null },
  });
  expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBeUndefined();
  expect(wrapper.find('.operation_track--unknown').exists()).toBe(true);
  expect(wrapper.find('.operation_percent').exists()).toBe(false);
  expect(wrapper.find('.operation_detail').exists()).toBe(false);
});
