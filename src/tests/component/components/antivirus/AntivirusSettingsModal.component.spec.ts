import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AntivirusSettingsModal from '@/components/antivirus/AntivirusSettingsModal.vue';
import { antivirusStatus } from '@/tests/fixtures/antivirus';
import { setLocale } from '@/i18n';

import { askNasShell } from '@/services/nasShell';
vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  setLocale('it');
  vi.mocked(askNasShell).mockReset().mockResolvedValue({ enabled: false, rules: [] });
});
it('edits a draft, manages jobs and sends settings only on save', async () => {
  vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
  const settings = antivirusStatus(true).settings;
  const wrapper = mount(AntivirusSettingsModal, {
    props: { modelValue: true, settings, busy: false },
  });
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Aggiungi job')
    ?.trigger('click');
  expect(settings.schedules).toHaveLength(0);
  await wrapper.findAll('input[type="checkbox"]')[0]?.setValue(true);
  await wrapper.findAll('input[type="checkbox"]')[3]?.setValue(false);
  await wrapper.findAll('select')[1]?.setValue('Mon');
  await wrapper.get('select').setValue('custom');
  await wrapper.get('textarea').setValue('/srv/storage/a\n/srv/storage/b');
  await wrapper.get('input[type="time"]').setValue('04:25');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
    schedules: [
      {
        id: expect.stringMatching(
          /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/,
        ),
        kind: 'custom',
        time: '04:25',
        paths: ['/srv/storage/a', '/srv/storage/b'],
      },
    ],
  });
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Rimuovi')
    ?.trigger('click');
  expect(wrapper.findAll('fieldset')).toHaveLength(2);
  await wrapper.get('[data-tab="quarantine"]').trigger('click');
  await wrapper.get('input[type="checkbox"]').setValue(true);
  await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('save')?.at(-1)?.[0]).toMatchObject({ autoQuarantine: true });
  wrapper.unmount();
});
it('supports keyboard tabs, cancellation and new settings when reopened', async () => {
  const wrapper = mount(AntivirusSettingsModal, {
    props: { modelValue: true, settings: antivirusStatus(true).settings, busy: true },
  });
  await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' });
  expect(wrapper.get('[data-tab="scans"]').attributes('aria-selected')).toBe('true');
  await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'End' });
  expect(wrapper.get('[data-tab="quarantine"]').attributes('aria-selected')).toBe('true');
  await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'ArrowLeft' });
  expect(wrapper.get('[data-tab="scans"]').attributes('aria-selected')).toBe('true');
  await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' });
  await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' });
  expect(wrapper.get('[data-tab="general"]').attributes('aria-selected')).toBe('true');
  await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'Home' });
  await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'Enter' });
  await wrapper.setProps({ modelValue: false });
  await wrapper.setProps({ modelValue: true });
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Annulla')
    ?.trigger('click');
  expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  expect(wrapper.emitted('save')).toBeUndefined();
  wrapper.unmount();
});

it('saves independent configurable boot and shutdown scans', async () => {
  const wrapper = mount(AntivirusSettingsModal, {
    props: { modelValue: true, settings: antivirusStatus(true).settings, busy: false },
  });
  await wrapper.get('[data-testid="antivirus_bootScan"]').setValue(true);
  await wrapper.get('[data-testid="antivirus_bootScan_kind"]').setValue('full');
  await wrapper.get('[data-testid="antivirus_shutdownScan"]').setValue(true);
  await wrapper.get('[data-testid="antivirus_shutdownScan_kind"]').setValue('custom');
  await wrapper.get('textarea').setValue('/srv/storage/a\n\n /srv/storage/b ');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
    bootScan: { enabled: true, kind: 'full', paths: [] },
    shutdownScan: { enabled: true, kind: 'custom', paths: ['/srv/storage/a', '/srv/storage/b'] },
  });
  wrapper.unmount();
});
it('blocks an off-time job and warns about shutdown or restart soon', async () => {
  vi.mocked(askNasShell).mockResolvedValue({
    enabled: true,
    rules: [
      { day: 'everyday', time: '23:00', action: 'shutdown' },
      { day: 'everyday', time: '07:00', action: 'start' },
    ],
  });
  const settings = antivirusStatus(true).settings;
  settings.schedulerEnabled = true;
  settings.schedules = [
    { id: 'one', enabled: true, kind: 'quick', day: '*', time: '03:00', paths: [] },
  ];
  const wrapper = mount(AntivirusSettingsModal, {
    props: { modelValue: true, settings, busy: false },
  });
  await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('NAS risulta spento');
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('save')).toBeUndefined();
  await wrapper.get('input[type="time"]').setValue('22:45');
  expect(wrapper.get('[role="alert"]').text()).toContain('entro 30 minuti');
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined();
  await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('save')).toHaveLength(1);
  wrapper.unmount();
});
it('shows unreadable power rules without preventing manual settings', async () => {
  vi.mocked(askNasShell).mockRejectedValue(new Error('unavailable'));
  const wrapper = mount(AntivirusSettingsModal, {
    props: { modelValue: true, settings: antivirusStatus(true).settings, busy: false },
  });
  await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('non disponibili');
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined();
  wrapper.unmount();
});

it('offers only to turn the antivirus on while it is off', async () => {
  const wrapper = mount(AntivirusSettingsModal, {
    props: { modelValue: true, settings: antivirusStatus().settings, busy: false },
  });
  expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toEqual(['Generale']);
  expect(wrapper.find('button[type="submit"]').exists()).toBe(false);
  await wrapper.get('[data-testid="antivirus_enable"]').trigger('click');
  expect(wrapper.emitted('toggle')).toEqual([[true]]);
  wrapper.unmount();
});

it('turns the antivirus off only after a confirmation', async () => {
  const wrapper = mount(AntivirusSettingsModal, {
    props: { modelValue: true, settings: antivirusStatus(true).settings, busy: false },
  });
  await wrapper.get('[data-tab="general"]').trigger('click');
  await wrapper.get('[data-testid="antivirus_disable"]').trigger('click');
  expect(wrapper.emitted('toggle')).toBeUndefined();
  expect(wrapper.get('[role="alert"]').text()).toContain('L’antivirus resta installato');
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Annulla' && button.element.closest('.general_confirm'))
    ?.trigger('click');
  expect(wrapper.find('[data-testid="antivirus_disable_confirm"]').exists()).toBe(false);
  await wrapper.get('[data-testid="antivirus_disable"]').trigger('click');
  await wrapper.get('[data-testid="antivirus_disable_confirm"]').trigger('click');
  expect(wrapper.emitted('toggle')).toEqual([[false]]);
  wrapper.unmount();
});

it('groups the options of every kind of scan in one tab, as cards', async () => {
  const wrapper = mount(AntivirusSettingsModal, {
    props: { modelValue: true, settings: antivirusStatus(true).settings, busy: false },
  });
  await wrapper.get('[data-tab="scans"]').trigger('click');
  const cards = wrapper.findAll('.scan_card');
  expect(cards.map((card) => card.get('h3').text())).toEqual([
    'Rapida',
    'Totale',
    'File',
    'Personalizzata',
    'File già controllati',
  ]);
  await wrapper.get('[data-testid="antivirus_forget"]').trigger('click');
  expect(wrapper.emitted('forget')).toHaveLength(1);
  await wrapper
    .get('[data-testid="antivirus_options_full"] input[type="checkbox"]')
    .setValue(false);
  await wrapper.get('form').trigger('submit');
  expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ full: { archives: false } });
  wrapper.unmount();
});
