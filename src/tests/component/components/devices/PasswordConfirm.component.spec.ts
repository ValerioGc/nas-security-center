import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it } from 'vitest';
import PasswordConfirm from '@/components/devices/PasswordConfirm.vue';
import { setLocale } from '@/i18n';

beforeEach(() => setLocale('it'));
afterEach(() => {
  document.body.innerHTML = '';
});

function form(props: { busy?: boolean; error?: string } = {}) {
  return mount(PasswordConfirm, {
    props: { note: 'Serve la password', action: 'Conferma', ...props },
    attachTo: document.body,
  });
}

it('takes the focus and sends the password only once one is written', async () => {
  const wrapper = form();
  const input = wrapper.get('[data-testid="password_confirm_input"]');
  expect(document.activeElement).toBe(input.element);
  expect(
    wrapper.get('[data-testid="password_confirm_submit"]').attributes('disabled'),
  ).toBeDefined();

  await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('confirm')).toBeUndefined();

  await input.setValue('secret');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('confirm')).toEqual([['secret']]);
  wrapper.unmount();
});

it('waits while busy, shows the error and lets the person step back', async () => {
  const wrapper = form({ busy: true, error: 'Password errata' });
  await wrapper.get('[data-testid="password_confirm_input"]').setValue('secret');
  await wrapper.get('form').trigger('submit');

  expect(wrapper.emitted('confirm')).toBeUndefined();
  expect(wrapper.get('[data-testid="password_confirm_error"]').text()).toBe('Password errata');
  await wrapper.get('button[type="button"]').trigger('click');
  expect(wrapper.emitted('cancel')).toHaveLength(1);
  wrapper.unmount();
});
