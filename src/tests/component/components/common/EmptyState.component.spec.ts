import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import EmptyState from '@/components/common/EmptyState.vue';

it('says what goes there, with its symbol and its actions', () => {
  const wrapper = mount(EmptyState, {
    props: { title: 'Empty', text: 'Nothing yet', svg: '/antivirus.svg', testid: 'empty' },
    slots: { default: '<button>Act</button>' },
  });
  expect(wrapper.get('[data-testid="empty"]').attributes('role')).toBeUndefined();
  expect(wrapper.get('.empty_title').text()).toBe('Empty');
  expect(wrapper.get('.empty_text').text()).toBe('Nothing yet');
  expect(wrapper.find('.app_icon').exists()).toBe(true);
  expect(wrapper.get('.empty_actions button').text()).toBe('Act');
});

it('turns while it reads, as a status', () => {
  const wrapper = mount(EmptyState, { props: { title: 'Reading…', loading: true } });
  expect(wrapper.attributes('role')).toBe('status');
  expect(wrapper.find('.empty_spinner').exists()).toBe(true);
  expect(wrapper.find('.empty_text').exists()).toBe(false);
  expect(wrapper.find('.empty_actions').exists()).toBe(false);
});
