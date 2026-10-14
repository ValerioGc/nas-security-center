import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import AllowedAddresses from '@/components/access/AllowedAddresses.vue';
import { setLocale } from '@/i18n';
import type { AccessRule, NewAccessRule } from '@/types';

const laptop: AccessRule = {
  id: '1',
  kind: 'ip',
  value: '192.168.1.20',
  label: '',
  createdAt: 0,
};

function list(rules: AccessRule[] = [], props: { busy?: boolean; error?: string } = {}) {
  return mount(AllowedAddresses, {
    props: { rules, busy: false, error: '', ...props },
    attachTo: document.body,
  });
}

/** The rule the list asked to add, answering the launcher with `added`. */
function added(wrapper: ReturnType<typeof list>, outcome: boolean) {
  const [rule, done] = wrapper.emitted('add')?.at(-1) as [NewAccessRule, (ok: boolean) => void];
  done(outcome);
  return rule;
}

beforeEach(() => setLocale('it'));

describe('the allowed addresses', () => {
  it('says whether the list restricts anything at all', () => {
    expect(list().get('[data-testid="access_rules_note"]').text()).toContain(
      'non è limitato dall’indirizzo',
    );

    const restricted = list([laptop]);
    expect(restricted.get('[data-testid="access_rules_note"]').text()).toContain(
      'esclusivamente agli indirizzi',
    );
    expect(restricted.get('[data-testid="access_rules_row_1"]').text()).toContain('-');
  });

  it('shows the fields only after Add, focuses the value and hides them on cancel', async () => {
    const wrapper = list();
    expect(wrapper.find('[data-testid="access_rule_form"]').exists()).toBe(false);

    await wrapper.get('[data-testid="access_rule_open"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(wrapper.get('[data-testid="access_rule_value"]').element);
    expect(wrapper.find('[data-testid="access_rule_open"]').exists()).toBe(false);

    await wrapper.get('[data-testid="access_rule_cancel"]').trigger('click');
    expect(wrapper.find('[data-testid="access_rule_form"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('offers an address or a range, and sends the one chosen', async () => {
    const wrapper = list();
    await wrapper.get('[data-testid="access_rule_open"]').trigger('click');
    expect(wrapper.findAll('[data-testid^="access_rule_kind_"]').map((b) => b.text())).toEqual([
      'Indirizzo',
      'Intervallo',
    ]);
    expect(wrapper.get('[data-testid="access_rule_add"]').attributes('disabled')).toBeDefined();

    await wrapper.get('[data-testid="access_rule_kind_range"]').trigger('click');
    expect(wrapper.get('[data-testid="access_rule_kind_range"]').attributes('aria-pressed')).toBe(
      'true',
    );
    await wrapper.get('[data-testid="access_rule_value"]').setValue(' 192.168.1.0/24 ');
    await wrapper.get('[data-testid="access_rule_label"]').setValue('Casa');
    await wrapper.get('[data-testid="access_rule_form"]').trigger('submit');

    expect(added(wrapper, true)).toEqual({ kind: 'range', value: '192.168.1.0/24', label: 'Casa' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="access_rule_form"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('keeps the fields open when the launcher refuses the address', async () => {
    const wrapper = list([], { error: 'invalid IP address' });
    await wrapper.get('[data-testid="access_rule_open"]').trigger('click');
    await wrapper.get('[data-testid="access_rule_value"]').setValue('not an address');
    await wrapper.get('[data-testid="access_rule_form"]').trigger('submit');
    added(wrapper, false);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="access_rule_form"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="access_rule_error"]').text()).toBe('invalid IP address');
    wrapper.unmount();
  });

  it('sends nothing while busy or empty, and removes from the row', async () => {
    const wrapper = list([laptop], { busy: true });
    await wrapper.get('[data-testid="access_rule_open"]').trigger('click');
    await wrapper.get('[data-testid="access_rule_value"]').setValue('10.0.0.8');
    await wrapper.get('[data-testid="access_rule_form"]').trigger('submit');
    expect(wrapper.emitted('add')).toBeUndefined();

    await wrapper.setProps({ busy: false });
    await wrapper.get('[data-testid="access_rule_value"]').setValue('   ');
    await wrapper.get('[data-testid="access_rule_form"]').trigger('submit');
    expect(wrapper.emitted('add')).toBeUndefined();

    await wrapper.get('[aria-label="Rimuovi 192.168.1.20"]').trigger('click');
    expect(wrapper.emitted('remove')).toEqual([[laptop]]);
    wrapper.unmount();
  });
});
