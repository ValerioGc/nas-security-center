import { toRaw } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AntivirusPage from '@/components/sections/AntivirusPage.vue';
import { askNasShell, pickAntivirusPath } from '@/services/nasShell';
import { setLocale } from '@/i18n';
import { antivirusStatus } from '@/tests/fixtures/antivirus';

vi.mock('@/services/nasShell', () => ({ askNasShell: vi.fn(), pickAntivirusPath: vi.fn() }));
let state = antivirusStatus();
const wrappers: ReturnType<typeof mount>[] = [];
async function page() {
  const wrapper = mount(AntivirusPage);
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
}
beforeEach(() => {
  vi.useFakeTimers();
  setLocale('it');
  state = antivirusStatus();
  vi.mocked(askNasShell)
    .mockReset()
    .mockImplementation(async (type, payload) => {
      if (type === 'antivirus-status') {
        return structuredClone(state) as never;
      }
      if (type === 'antivirus-enable') {
        state = antivirusStatus((payload as { enabled: boolean }).enabled);
      }
      if (type === 'antivirus-settings') {
        state.settings = structuredClone(toRaw(payload)) as typeof state.settings;
      }
      return undefined as never;
    });
  vi.mocked(pickAntivirusPath).mockReset();
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.useRealTimers();
});

it('starts disabled and is turned on and off only from its settings', async () => {
  const wrapper = await page();
  expect(wrapper.find('[data-testid="antivirus_scans"]').exists()).toBe(false);
  expect(wrapper.get('[data-testid="antivirus_off"]').text()).toContain('Antivirus disabilitato');
  expect(askNasShell).not.toHaveBeenCalledWith('antivirus-enable', expect.anything());
  await wrapper.get('[data-testid="antivirus_open_settings"]').trigger('click');
  await wrapper.get('[data-testid="antivirus_enable"]').trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-enable', { enabled: true });
  expect(wrapper.find('dialog').exists()).toBe(false);
  expect(wrapper.find('[data-testid="antivirus_scans"]').exists()).toBe(true);

  await wrapper.get('[data-testid="antivirus_settings"]').trigger('click');
  await wrapper.get('[data-tab="general"]').trigger('click');
  await wrapper.get('[data-testid="antivirus_disable"]').trigger('click');
  await wrapper.get('[data-testid="antivirus_disable_confirm"]').trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-enable', { enabled: false });
  expect(wrapper.find('[data-testid="antivirus_off"]').exists()).toBe(true);
  expect(wrapper.find('[data-testid="antivirus_settings"]').exists()).toBe(true);
});

it('shows a placeholder while it reads the state of the antivirus', async () => {
  vi.mocked(askNasShell).mockImplementation(() => new Promise<never>(() => undefined));
  const wrapper = mount(AntivirusPage);
  wrappers.push(wrapper);
  await flushPromises();
  expect(wrapper.get('[data-testid="antivirus_loading"]').attributes('role')).toBe('status');
  expect(wrapper.find('[data-testid="antivirus_settings"]').exists()).toBe(false);
});

it('shows actual install progress and locks actions while work is running', async () => {
  state.operation = { phase: 'installing', progress: 35, error: null };
  const wrapper = await page();
  expect(wrapper.get('progress').attributes('aria-valuenow')).toBe('35');
  expect(wrapper.get('.operation_percent').text()).toBe('35%');
  expect(wrapper.find('[data-testid="antivirus_off"]').exists()).toBe(false);
  expect(wrapper.get('[data-testid="antivirus_settings"]').attributes('disabled')).toBeDefined();
  state.operation.progress = null;
  await vi.advanceTimersByTimeAsync(2000);
  await flushPromises();
  expect(wrapper.find('progress').exists()).toBe(false);
  expect(wrapper.find('.operation_spinner').exists()).toBe(true);
  state.operation.progress = 100;
  await vi.advanceTimersByTimeAsync(2000);
  expect(wrapper.find('[data-testid="antivirus_preparing"]').exists()).toBe(true);
  expect(wrapper.find('progress').exists()).toBe(false);
  state.settings.enabled = true;
  state.operation = { phase: 'updating', progress: null, error: null };
  await vi.advanceTimersByTimeAsync(2000);
  expect(wrapper.find('[data-testid="antivirus_preparing"]').exists()).toBe(true);
  expect(wrapper.find('[data-testid="antivirus_scans"]').exists()).toBe(false);
  state.operation.phase = '';
  await vi.advanceTimersByTimeAsync(2000);
  expect(wrapper.find('[data-testid="antivirus_preparing"]').exists()).toBe(false);
  expect(wrapper.find('[data-testid="antivirus_scans"]').exists()).toBe(true);
});

it('runs every scan type and uses custom defaults or the Explorer picker', async () => {
  state = antivirusStatus(true);
  state.settings.custom.paths = ['/srv/storage'];
  const wrapper = await page();
  await wrapper.get('[data-testid="antivirus_scan"]').trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-scan', { kind: 'quick', paths: [] });
  await wrapper.get('[data-testid="antivirus_kind_full"] input').setValue(true);
  await wrapper.get('[data-testid="antivirus_scan"]').trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-scan', { kind: 'full', paths: [] });
  await wrapper.get('[data-testid="antivirus_kind_custom"] input').setValue(true);
  await wrapper.get('[data-testid="antivirus_scan"]').trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-scan', {
    kind: 'custom',
    paths: ['/srv/storage'],
  });
  vi.mocked(pickAntivirusPath).mockResolvedValue('/srv/storage/Documents');
  const chooseFolder = wrapper
    .findAll('button')
    .find((button) => button.text() === 'Scegli cartella dal NAS');
  await chooseFolder?.trigger('click');
  await flushPromises();
  expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe(
    '/srv/storage/Documents',
  );
  await wrapper.get('[data-testid="antivirus_kind_file"] input').setValue(true);
  await wrapper.get('textarea').setValue('');
  expect(wrapper.get('[data-testid="antivirus_scan"]').attributes('disabled')).toBeDefined();
  vi.mocked(pickAntivirusPath).mockResolvedValue('/srv/storage/test.txt');
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Scegli file dal NAS')
    ?.trigger('click');
  await flushPromises();
  await wrapper.get('[data-testid="antivirus_scan"]').trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-scan', {
    kind: 'file',
    paths: ['/srv/storage/test.txt'],
  });
});

it('skips the unchanged files of a custom scan only when asked, and forgets those already scanned', async () => {
  state = antivirusStatus(true);
  state.settings.custom.paths = ['/srv/storage'];
  state.report = { ...state.report, at: 1000, kind: 'quick', scanned: 3, skipped: 40 };
  const wrapper = await page();
  expect(wrapper.text()).toContain('Saltati perché non modificati: 40');
  expect(wrapper.text()).toContain('Dopo 30 giorni');
  expect(wrapper.find('[data-testid="antivirus_skip_unchanged"]').exists()).toBe(false);
  await wrapper.get('[data-testid="antivirus_kind_custom"] input').setValue(true);
  expect(wrapper.text()).not.toContain('Dopo 30 giorni');
  await wrapper.get('[data-testid="antivirus_skip_unchanged"]').setValue(true);
  expect(wrapper.text()).toContain('Dopo 30 giorni');
  await wrapper.get('[data-testid="antivirus_scan"]').trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-scan', {
    kind: 'custom',
    paths: ['/srv/storage'],
    skipUnchanged: true,
  });
  state.operation = { phase: 'scanning', progress: 25, error: null };
  state.report = { ...state.report, scanned: 50, planned: 200 };
  await vi.advanceTimersByTimeAsync(2000);
  await flushPromises();
  expect(wrapper.get('.operation_detail').text()).toBe('File controllati: 50 / 200');
  state.operation = { phase: '', progress: null, error: null };
  await vi.advanceTimersByTimeAsync(2000);
  await flushPromises();
  await wrapper.get('[data-testid="antivirus_settings"]').trigger('click');
  await wrapper.get('[data-tab="scans"]').trigger('click');
  await wrapper.get('[data-testid="antivirus_forget"]').trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-forget', undefined);
  expect(wrapper.find('dialog').exists()).toBe(false);
});

it('saves tabbed settings and handles manual quarantine, restore and permanent deletion', async () => {
  state = antivirusStatus(true);
  state.report = {
    at: 1000,
    kind: 'quick',
    scanned: 7,
    found: 1,
    skipped: 0,
    planned: 0,
    error: null,
    detections: [{ id: 'a', path: '/srv/storage/a', threat: 'Eicar' }],
    quarantine: [{ detection: { id: 'b', path: '/srv/storage/b', threat: 'Eicar' }, at: 1000 }],
  };
  const wrapper = await page();
  const button = (label: string) => wrapper.findAll('button').find((item) => item.text() === label);
  await button('Sposta in quarantena')?.trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-quarantine', { id: 'a' });
  await button('Ripristina')?.trigger('click');
  expect(wrapper.get('dialog').text()).toContain('Può contenere una minaccia');
  await button('Conferma')?.trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-restore', { id: 'b' });
  await button('Elimina definitivamente')?.trigger('click');
  await button('Conferma')?.trigger('click');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-delete', { id: 'b' });
  await wrapper.get('[data-testid="antivirus_settings"]').trigger('click');
  expect(wrapper.findAll('[role="tab"]')).toHaveLength(4);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(askNasShell).toHaveBeenCalledWith('antivirus-settings', state.settings);
  expect(wrapper.find('dialog').exists()).toBe(false);
});

it('shows failures and stops polling after the page closes', async () => {
  vi.mocked(askNasShell).mockRejectedValue(new Error('Launcher unavailable'));
  const wrapper = await page();
  expect(wrapper.get('[role="alert"]').text()).toContain('launcher');
  const count = vi.mocked(askNasShell).mock.calls.length;
  wrapper.unmount();
  await vi.advanceTimersByTimeAsync(5000);
  expect(askNasShell).toHaveBeenCalledTimes(count);
});

it('reports scanner errors and picker failures without losing the page', async () => {
  state = antivirusStatus(true);
  state.report.at = 1000;
  state.report.error = 'scan incomplete';
  const wrapper = await page();
  expect(wrapper.text()).toContain('scan incomplete');
  await wrapper.get('[data-testid="antivirus_kind_file"] input').setValue(true);
  vi.mocked(pickAntivirusPath).mockRejectedValue(new Error('picker unavailable'));
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Scegli file dal NAS')
    ?.trigger('click');
  await flushPromises();
  expect(wrapper.text()).toContain('picker unavailable');
  state.report.error = null;
  state.report.found = 0;
  await vi.advanceTimersByTimeAsync(2000);
  await flushPromises();
  expect(wrapper.text()).toContain('Scansione completata senza minacce');
});

it('discards pending polling replies when the page closes', async () => {
  let resolve: (value: never) => void = () => undefined;
  vi.mocked(askNasShell).mockImplementation(
    () =>
      new Promise<never>((done) => {
        resolve = done;
      }),
  );
  const wrapper = mount(AntivirusPage);
  wrapper.unmount();
  resolve(antivirusStatus() as never);
  await flushPromises();
  await vi.advanceTimersByTimeAsync(4000);
  expect(askNasShell).toHaveBeenCalledTimes(1);
});

it('discards pending polling failures when the page closes', async () => {
  let reject: (reason: Error) => void = () => undefined;
  vi.mocked(askNasShell).mockImplementation(
    () =>
      new Promise<never>((_done, fail) => {
        reject = fail;
      }),
  );
  const wrapper = mount(AntivirusPage);
  wrapper.unmount();
  reject(new Error('Launcher unavailable'));
  await flushPromises();
  await vi.advanceTimersByTimeAsync(4000);
  expect(askNasShell).toHaveBeenCalledTimes(1);
});

it('shows the whole reason of a failure beside its retry', async () => {
  state.operation = {
    phase: '',
    progress: null,
    error: "freshclam failed: ERROR: Can't download daily.cvd\nERROR: Update failed",
  };
  const wrapper = await page();
  const alert = wrapper.get('[role="alert"]');
  expect(alert.get('.alert_message').text()).toBe(
    "freshclam failed: ERROR: Can't download daily.cvd\nERROR: Update failed",
  );
  expect(alert.get('button').text()).toBe('Riprova');
  expect(wrapper.get('[data-testid="antivirus_open_settings"]').classes()).toContain('primary');

  state = antivirusStatus(true);
  await alert.get('button').trigger('click');
  await flushPromises();
  expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  expect(wrapper.find('[data-testid="antivirus_scans"]').exists()).toBe(true);
});
