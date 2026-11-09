import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import DiscoveryPanel from '@/components/access/DiscoveryPanel.vue';
import { messages, setLocale } from '@/i18n';
import type { DiscoveryStatus } from '@/types';

const t = messages.it;

function panel(enabled: boolean, status: DiscoveryStatus | null) {
  return mount(DiscoveryPanel, { props: { modelValue: enabled, status, busy: false } });
}

const text = (wrapper: ReturnType<typeof panel>, id: string) =>
  wrapper.get(`[data-testid="${id}"]`).text();

beforeEach(() => setLocale('it'));

describe('the discovery panel', () => {
  it('shows the port, the responder and the open firewall while it is on', () => {
    const wrapper = panel(true, { port: 39877, listening: true, applied: true });

    expect(text(wrapper, 'access_discovery_state')).toBe(t.discoveryStates.active);
    expect(text(wrapper, 'access_discovery_port')).toBe('UDP 39877');
    expect(text(wrapper, 'access_discovery_responder')).toBe(t.discoveryListening);
    expect(text(wrapper, 'access_discovery_firewall')).toBe(t.discoveryOpen);
    expect(wrapper.text()).toContain(t.discoveryScopeValue);
    expect(wrapper.find('[role="note"]').exists()).toBe(false);
  });

  it('says the port is closed while it is off', () => {
    const wrapper = panel(false, { port: 39877, listening: true, applied: true });

    expect(text(wrapper, 'access_discovery_state')).toBe(t.discoveryStates.off);
    expect(text(wrapper, 'access_discovery_firewall')).toBe(t.discoveryClosed);
  });

  it('warns when the gateway does not listen on the port', () => {
    const wrapper = panel(true, { port: 39877, listening: false, applied: true });

    expect(text(wrapper, 'access_discovery_state')).toBe(t.discoveryStates.problem);
    expect(text(wrapper, 'access_discovery_responder')).toBe(t.discoverySilent);
    expect(text(wrapper, 'access_discovery_silent')).toBe(
      t.discoverySilentNote.replace('{port}', '39877'),
    );
  });

  it('warns when the last change of the firewall was not applied', () => {
    const wrapper = panel(false, { port: 39877, listening: true, applied: false });

    expect(text(wrapper, 'access_discovery_state')).toBe(t.discoveryStates.problem);
    expect(text(wrapper, 'access_discovery_firewall')).toBe(t.discoveryNotApplied);
    expect(text(wrapper, 'access_discovery_not_applied')).toBe(t.discoveryNotAppliedNote);
  });

  it('says what it cannot check outside a NAS', () => {
    const wrapper = panel(true, { port: 39877, listening: null, applied: null });

    expect(text(wrapper, 'access_discovery_state')).toBe(t.discoveryStates.active);
    expect(text(wrapper, 'access_discovery_responder')).toBe(t.discoveryUnknown);
    expect(text(wrapper, 'access_discovery_firewall')).toBe(t.discoveryUnknown);
  });

  it('keeps only the switch with a launcher that reads no status', async () => {
    const wrapper = panel(false, null);

    expect(text(wrapper, 'access_discovery_state')).toBe(t.discoveryStates.off);
    expect(wrapper.find('[data-testid="access_discovery_details"]').exists()).toBe(false);

    await wrapper.get('[data-testid="access_discovery_enabled"]').setValue(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
  });
});
