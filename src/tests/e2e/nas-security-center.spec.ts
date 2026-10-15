import { expect, test, type Page } from '@playwright/test';

/**
 * The launcher, as far as this application can tell: a page that holds it in a frame and answers
 * its requests about the access, keeping what it is told. The application never reaches the
 * launcher otherwise.
 */
async function openInShell(page: Page, firstDevice = false) {
  await page.route('**/shell.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><iframe src="/" title="app" style="width:100%;height:95vh"></iframe>
<script>
  const antivirusOptions = () => ({ archives: true, detectPua: false, maxFileMb: 100, paths: [], exclusions: [] });
  const state = {
    antivirus: {
      settings: { enabled: false, schedulerEnabled: false,
      bootScan: { enabled: false, kind: 'quick', paths: [] },
      shutdownScan: { enabled: false, kind: 'quick', paths: [] }, autoQuarantine: false, full: antivirusOptions(), quick: antivirusOptions(), file: antivirusOptions(), custom: antivirusOptions(), schedules: [] },
      installed: false,
      operation: { phase: '', progress: null, error: null },
      // One file waits in quarantine, the test signature every antivirus knows: the view and its
      // actions can be tried without a real threat.
      report: { at: 0, kind: null, scanned: 0, found: 0, skipped: 0, planned: 0, detections: [], error: null,
        quarantine: [{ at: Date.UTC(2026, 9, 10, 9, 30),
          detection: { id: 'q-eicar', path: '/srv/storage/Documenti/eicar.com', threat: 'Eicar-Test-Signature' } },
          { at: Date.UTC(2026, 9, 10, 9, 31),
          detection: { id: 'q-eicar-zip', path: '/srv/storage/Download/eicar.zip', threat: 'Eicar-Test-Signature' } }] },
    },
    settings: { notifyFailures: false },
    discovery: { enabled: false },
    policy: { enabled: true, attempts: 5, lockMinutes: 1 },
    rules: [],
    refused: [
      { id: '9', at: Date.UTC(2026, 9, 2, 8, 15), from: '192.168.1.66', field: 'password' },
    ],
    mtls: { enabled: false, available: true, current: null },
    https: { port: 443, force: false },
    certificate: {
      served: true,
      custom: false,
      active: {
        subject: 'nas',
        issuer: 'nas-os NAS authority',
        names: ['nas', 'nas.local', '127.0.0.1'],
        notBefore: 1780000000,
        notAfter: 1810000000,
        fingerprint: 'ef'.repeat(32),
      },
      authority: {
        subject: 'nas-os NAS authority',
        issuer: 'nas-os NAS authority',
        names: [],
        notBefore: 1780000000,
        notAfter: 2400000000,
        fingerprint: '12'.repeat(32),
      },
      automaticNames: ['nas', 'nas.local', '127.0.0.1'],
      extraNames: [],
    },
    devices: [
      {
        id: 1,
        name: 'Portatile in studio',
        icon: 'laptop',
        createdAt: Date.UTC(2026, 9, 1),
        current: true,
        certificate: {
          fingerprint: 'ab'.repeat(32),
          state: 'active',
          issuedAt: Date.UTC(2026, 9, 1),
          expiresAt: Date.UTC(2028, 9, 1),
          activatedAt: Date.UTC(2026, 9, 1, 9),
          seenAt: Date.UTC(2026, 9, 2, 9),
        },
      },
    ],
  };
  if (${firstDevice}) {
    state.devices = [];
  } else {
    state.mtls.current = state.devices[0];
  }
  const PASSWORD = 'segreta';
  const checked = (password) => {
    if (password !== PASSWORD) throw new Error('wrong password');
  };
  const device = (id) => state.devices.find((item) => item.id === id);
  const issued = (item) => ({
    device: item,
    credential: { file: btoa('p12'), fileName: 'nas-os-device.p12', password: 'Kq7Zr2mVx9Lp4Tn8Wc3B' },
  });
  const pending = () => ({
    fingerprint: 'cd'.repeat(32),
    state: 'pending',
    issuedAt: Date.UTC(2026, 9, 3),
    expiresAt: Date.UTC(2028, 9, 3),
    activatedAt: null,
    seenAt: null,
  });
  let next = 1;
  window.asked = [];
  const answers = {
    'power-schedule': () => ({ enabled: false, rules: [] }),
    'antivirus-status': () => state.antivirus,
    'antivirus-enable': ({ enabled }) => {
      if (!enabled) { state.antivirus.settings.enabled = false; return null; }
      state.antivirus.operation = { phase: 'installing', progress: 25, error: null };
      setTimeout(() => {
        state.antivirus.settings.enabled = true;
        state.antivirus.installed = true;
        state.antivirus.operation = { phase: '', progress: null, error: null };
      }, 2500);
      return null;
    },
    'antivirus-settings': (settings) => { state.antivirus.settings = settings; return settings; },
    'antivirus-restore': ({ id }) => {
      state.antivirus.report.quarantine = state.antivirus.report.quarantine.filter((entry) => entry.detection.id !== id);
      return null;
    },
    'antivirus-delete': ({ id }) => {
      state.antivirus.report.quarantine = state.antivirus.report.quarantine.filter((entry) => entry.detection.id !== id);
      return null;
    },
    'antivirus-scan': ({ kind, skipUnchanged }) => {
      // Asked to, the scan leaves out the files found clean before: here 30 of them.
      const skipped = kind === 'quick' || skipUnchanged ? 30 : 0;
      state.antivirus.report = { ...state.antivirus.report, at: Date.now(), kind, scanned: 12, found: 0, skipped, planned: skipped ? 12 : 0, error: null };
      return null;
    },
    'antivirus-forget': () => null,
    'access-settings': () => state.settings,
    'save-access-settings': (payload) => (state.settings = payload),
    'discovery-settings': () => state.discovery,
    'save-discovery-settings': (payload) => (state.discovery = payload),
    'access-rules': () => state.rules,
    'add-access-rule': (payload) => {
      if (!/^[0-9.:/a-f]+$/.test(payload.value)) throw new Error('invalid IP address');
      state.rules.push({ ...payload, id: String(next++), createdAt: Date.UTC(2026, 9, 2) });
      return state.rules;
    },
    'remove-access-rule': ({ id }) => (state.rules = state.rules.filter((rule) => rule.id !== id)),
    'sign-in-policy': () => state.policy,
    'save-sign-in-policy': (payload) => (state.policy = payload),
    'refused-sign-ins': () => state.refused,
    'mtls-state': () => state.mtls,
    'save-mtls': ({ enabled, password }) => {
      checked(password);
      return (state.mtls = { ...state.mtls, enabled });
    },
    devices: () => state.devices,
    'add-device': ({ name, icon, password }) => {
      checked(password);
      const item = { id: state.devices.length + 1, name, icon, createdAt: Date.UTC(2026, 9, 3), current: false, certificate: pending() };
      state.devices.push(item);
      return issued(item);
    },
    'update-device': ({ id, name, icon }) => Object.assign(device(id), { name, icon }),
    'renew-device': ({ id, password }) => {
      checked(password);
      return issued(Object.assign(device(id), { certificate: pending() }));
    },
    'revoke-device': ({ id }) => {
      const item = device(id);
      item.certificate = { ...item.certificate, state: 'revoked' };
      return item;
    },
    certificate: () => state.certificate,
    'https-settings': () => state.https,
    'save-https-settings': ({ port, force, password }) => {
      checked(password);
      return (state.https = { port, force });
    },
    'save-certificate-names': ({ names, password }) => {
      checked(password);
      state.certificate.extraNames = names;
      state.certificate.active.names = [...state.certificate.automaticNames, ...names];
      return state.certificate;
    },
    'remove-device': ({ id }) => {
      state.devices = state.devices.filter((item) => item.id !== id);
      return null;
    },
  };
  addEventListener('message', ({ data, source }) => {
    // Only noted: the launcher would load itself again over HTTPS.
    if (data?.nas === 1 && data.type === 'open-https') {
      window.asked.push([data.type]);
      return;
    }
    if (!data || data.nas !== 1 || !(data.type in answers)) return;
    window.asked.push([data.type, data.payload]);
    let answer;
    try {
      answer = { success: true, data: answers[data.type](data.payload) };
    } catch (error) {
      answer = { success: false, error: error.message };
    }
    source.postMessage(
      { nas: 1, type: data.type + '-result', requestId: data.requestId, ...answer },
      location.origin,
    );
  });
</script>`,
    }),
  );
  await page.goto('/shell.html');
  return page.frameLocator('iframe');
}

const asked = (page: Page) =>
  page.evaluate(() => (window as unknown as { asked: [string, unknown][] }).asked);

test('the access settings are read and saved through the launcher', async ({ page }) => {
  const app = await openInShell(page);

  await expect(app.getByRole('heading', { level: 1, name: 'Accesso' })).toBeVisible();
  await expect(app.getByTestId('access_lock_attempts')).toHaveValue('5');
  await expect(app.getByTestId('access_save')).toHaveCount(0);

  // Where a person clicks: the switch, while its checkbox stays hidden.
  await app.getByTestId('access_notify_switch').click();
  await expect(app.getByTestId('access_notify')).toBeChecked();
  await app.getByTestId('access_lock_attempts').fill('3');
  await app.getByTestId('access_lock_attempts').blur();
  await expect
    .poll(() => asked(page))
    .toContainEqual(['save-sign-in-policy', { enabled: true, attempts: 3, lockMinutes: 1 }]);

  expect(await asked(page)).toContainEqual(['save-access-settings', { notifyFailures: true }]);
  expect(await asked(page)).toContainEqual([
    'save-sign-in-policy',
    { enabled: true, attempts: 3, lockMinutes: 1 },
  ]);

  // The discovery of NAS Finder, off after the wizard, goes on through the launcher.
  await expect(app.getByTestId('access_discovery_enabled')).not.toBeChecked();
  await app.getByTestId('access_discovery_enabled_switch').click();
  await expect(app.getByTestId('access_discovery_enabled')).toBeChecked();
  await expect
    .poll(() => asked(page))
    .toContainEqual(['save-discovery-settings', { enabled: true }]);
});

test('an allowed address is added, refused when malformed, and removed', async ({ page }) => {
  const app = await openInShell(page);

  await expect(app.getByTestId('access_rules_note')).toContainText('non è limitato dall’indirizzo');
  await app.getByTestId('access_rule_open').click();
  await app.getByTestId('access_rule_kind_range').click();
  await app.getByTestId('access_rule_value').fill('192.168.77.0/24');
  await app.getByTestId('access_rule_label').fill('Rete di prova');
  await app.getByTestId('access_rule_add').click();
  await expect(app.getByTestId('access_rules_note')).toContainText('esclusivamente agli indirizzi');
  await expect(app.getByTestId('access_rule_form')).toHaveCount(0);
  await expect(app.getByTestId('access_rules')).toContainText('Rete di prova');

  await app.getByTestId('access_rule_open').click();
  await app.getByTestId('access_rule_value').fill('non-un-indirizzo');
  await app.getByTestId('access_rule_add').click();
  await expect(app.getByTestId('access_rule_error')).toHaveText('invalid IP address');
  await expect(app.getByTestId('access_rule_form')).toBeVisible();

  await app.getByRole('button', { name: 'Rimuovi 192.168.77.0/24' }).click();
  await expect(app.getByTestId('access_rules_note')).toContainText('non è limitato dall’indirizzo');
});

test('the security log lists the refused sign-ins and says when they are not recorded', async ({
  page,
}) => {
  const app = await openInShell(page);

  await app.getByTestId('section_logs').click();
  await expect(app.getByRole('heading', { level: 1, name: 'Log di sicurezza' })).toBeVisible();
  await expect(app.getByTestId('logs_table')).toContainText('192.168.1.66');
  await expect(app.getByTestId('logs_table')).toContainText('Password');
  await expect(app.getByTestId('logs_recording_off')).toBeVisible();
});

test('mTLS is turned on with the password, which is asked again when wrong', async ({ page }) => {
  const app = await openInShell(page);

  await app.getByTestId('section_devices').click();
  await expect(app.getByTestId('device_1')).toContainText('Questo dispositivo');
  await app.getByTestId('mtls_enabled_switch').click();
  await app.getByTestId('password_confirm_input').fill('sbagliata');
  await app.getByTestId('password_confirm_submit').click();
  await expect(app.getByTestId('password_confirm_error')).toHaveText('Password errata');

  await app.getByTestId('password_confirm_input').fill('segreta');
  await app.getByTestId('password_confirm_submit').click();
  await expect(app.getByTestId('password_confirm')).toHaveCount(0);
  await expect(app.getByTestId('mtls_enabled')).toBeChecked();
  expect(await asked(page)).toContainEqual(['save-mtls', { enabled: true, password: 'segreta' }]);

  // The device in use cannot shut itself out.
  await app.getByTestId('device_1').click();
  await expect(app.getByTestId('device_locked')).toBeVisible();
  await expect(app.getByTestId('device_revoke')).toBeDisabled();
});

test('a device is added with its certificate, renewed, revoked and removed', async ({ page }) => {
  const app = await openInShell(page);

  await app.getByTestId('section_devices').click();
  await expect(app.getByTestId('device_new')).toBeDisabled();
  await app.getByTestId('mtls_enabled_switch').click();
  await app.getByTestId('password_confirm_input').fill('segreta');
  await app.getByTestId('password_confirm_submit').click();
  await app.getByTestId('device_new').click();
  await app.getByTestId('device_name').fill('Proiettore sala');
  await app.getByTestId('device_icon_projector').click();
  await app.getByTestId('device_password').fill('segreta');
  await app.getByTestId('device_add').click();
  await expect(app.getByTestId('credential_password')).toHaveText('Kq7Zr2mVx9Lp4Tn8Wc3B');
  const download = page.waitForEvent('download');
  await app.getByTestId('credential_download').click();
  expect((await download).suggestedFilename()).toBe('nas-os-device.p12');
  await app.getByTestId('device_done').click();
  await expect(app.getByTestId('device_2')).toContainText('In attesa del primo accesso');

  await app.getByTestId('device_2').click();
  await expect(app.getByTestId('device_certificate')).toContainText('CD:CD:CD');
  await app.getByTestId('device_renew').click();
  await app.getByTestId('password_confirm_input').fill('segreta');
  await app.getByTestId('password_confirm_submit').click();
  await expect(app.getByTestId('credential')).toBeVisible();
  await app.getByTestId('device_renew_done').click();

  await app.getByTestId('device_revoke').click();
  await app.getByTestId('device_action_confirm').click();
  await expect(app.getByTestId('device_certificate')).toContainText('Revocato');
  await expect(app.getByTestId('device_2')).toContainText('Revocato');

  await app.getByTestId('device_remove').click();
  await app.getByTestId('device_action_confirm').click();
  await expect(app.getByTestId('device_2')).toHaveCount(0);
  expect(await asked(page)).toContainEqual(['revoke-device', { id: 2 }]);
});

test('the first certificate can be issued only after selecting certificate access', async ({
  page,
}) => {
  const app = await openInShell(page, true);
  await app.getByTestId('section_devices').click();
  await expect(app.getByTestId('device_new')).toBeDisabled();
  await app.getByTestId('mtls_enabled_switch').click();
  await expect(app.getByTestId('device_new')).toBeEnabled();
  await expect(app.getByTestId('mtls_setup')).toBeVisible();
  await expect(app.getByTestId('password_confirm')).toHaveCount(0);
  await app.getByTestId('device_new').click();
  await app.getByTestId('device_name').fill('Primo dispositivo');
  await app.getByTestId('device_password').fill('segreta');
  await app.getByTestId('device_add').click();
  await expect(app.getByTestId('credential_password')).toBeVisible();
  expect((await asked(page)).some(([type]) => type === 'save-mtls')).toBe(false);
});

test('only the security content scrolls on desktop and mobile', async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 340 },
    { width: 390, height: 650 },
  ]) {
    await page.setViewportSize(viewport);
    await openInShell(page);
    const app = page.frameLocator('iframe');
    const sidebar = app.getByRole('complementary');
    const content = app.getByRole('main');
    await expect(app.getByRole('heading', { name: 'Accesso', exact: true })).toBeVisible();
    const before = await sidebar.boundingBox();
    const menu = sidebar.getByRole('button', { name: 'Accesso', exact: true });
    const menuBefore = await menu.boundingBox();
    const area = await content.boundingBox();
    expect(area).not.toBeNull();
    await page.mouse.move(area!.x + area!.width / 2, area!.y + area!.height / 2);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.mouse.wheel(0, 10_000);
    await expect
      .poll(() =>
        content.evaluate((element) =>
          Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop),
        ),
      )
      .toBeLessThanOrEqual(1);
    await page.mouse.wheel(0, 200);
    expect((await sidebar.boundingBox())?.y).toBe(before?.y);
    expect((await menu.boundingBox())?.y).toBe(menuBefore?.y);
    expect(
      await content.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight),
    ).toBe(true);
    await page.mouse.wheel(0, -10_000);
    await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBe(0);
    await page.mouse.wheel(0, -200);
    expect((await menu.boundingBox())?.y).toBe(menuBefore?.y);
    await sidebar.getByRole('button', { name: 'Log di sicurezza' }).click();
    await expect(app.getByRole('heading', { name: 'Log di sicurezza' })).toBeVisible();
  }
});

test('the certificates page says what the address is missing and adds it with the password', async ({
  page,
}) => {
  const app = await openInShell(page);

  await app.getByTestId('section_certificates').click();
  await expect(app.getByRole('heading', { level: 1, name: 'Certificati' })).toBeVisible();
  await expect(app.getByTestId('certificate_names')).toContainText('nas.local');
  await expect(app.getByTestId('certificate_plain')).toBeVisible();
  await app.getByTestId('certificate_open_https').click();
  await expect
    .poll(async () => (await asked(page)).some(([type]) => type === 'open-https'))
    .toBe(true);

  await app.getByTestId('extra_name_input').fill('nas.esempio.it');
  await app.getByTestId('extra_name_add').click();
  await app.getByTestId('extra_names_save').click();
  await app.getByTestId('password_confirm_input').fill('segreta');
  await app.getByTestId('password_confirm_submit').click();
  await expect(app.getByTestId('password_confirm')).toHaveCount(0);
  await expect(app.getByTestId('certificate_names')).toContainText('nas.esempio.it');
  expect(await asked(page)).toContainEqual([
    'save-certificate-names',
    { names: ['nas.esempio.it'], password: 'segreta' },
  ]);
});

test('HTTPS settings save the chosen port and slider without changing the certificate', async ({
  page,
}) => {
  const app = await openInShell(page);
  await app.getByTestId('section_certificates').click();
  const certificate = await app.getByTestId('active_certificate').textContent();
  await app.getByTestId('https_port').fill('8443');
  await app.getByTestId('force_https_switch').click();
  await app.getByTestId('https_save').click();
  await expect(app.getByTestId('password_confirm')).toContainText(
    'Il certificato rimane invariato',
  );
  await app.getByTestId('password_confirm_input').fill('segreta');
  await app.getByTestId('password_confirm_submit').click();
  await expect(app.getByTestId('password_confirm')).toHaveCount(0);
  await expect(app.getByTestId('https_save')).toBeDisabled();
  await expect(app.getByTestId('active_certificate')).toHaveText(certificate!);
  expect(await asked(page)).toContainEqual([
    'save-https-settings',
    { port: 8443, force: true, password: 'segreta' },
  ]);
});

test('antivirus installs on request, scans files and saves periodic jobs in tabbed settings', async ({
  page,
}) => {
  const app = await openInShell(page);
  await app.getByTestId('section_antivirus').click();
  await expect(app.getByTestId('antivirus_off')).toContainText('Antivirus disabilitato');
  await expect(app.getByTestId('antivirus_scans')).toHaveCount(0);
  // Turned on from the settings, which show only that while it is off.
  await app.getByTestId('antivirus_open_settings').click();
  await expect(app.getByRole('dialog').getByRole('tab')).toHaveCount(1);
  await app.getByRole('dialog').getByTestId('antivirus_enable').click();
  await expect(app.getByRole('dialog')).toHaveCount(0);
  await expect(app.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  await page.screenshot({ path: '/tmp/nas-antivirus-progress.png' });
  await expect(app.getByTestId('antivirus_scans')).toBeVisible();
  // The kinds are cards: choosing one leaves the others.
  await app.getByTestId('antivirus_kind_file').click();
  await expect(app.getByTestId('antivirus_kind_file').getByRole('radio')).toBeChecked();
  await expect(app.getByTestId('antivirus_kind_quick').getByRole('radio')).not.toBeChecked();
  await app.getByTestId('antivirus_paths').fill('/srv/storage/sample.txt');
  await app.getByTestId('antivirus_scan').click();
  await expect(app.getByText('Scansione completata senza minacce rilevate.')).toBeVisible();
  await app.getByTestId('antivirus_settings').click();
  const dialog = app.getByRole('dialog');
  await expect(dialog.getByRole('tab')).toHaveCount(4);
  await dialog.getByRole('tab', { name: 'Scansioni' }).click();
  for (const kind of ['quick', 'full', 'file', 'custom']) {
    await expect(dialog.getByTestId(`antivirus_options_${kind}`)).toBeVisible();
  }
  await page.screenshot({ path: '/tmp/nas-antivirus-settings-scans.png' });
  await dialog.getByRole('tab', { name: 'Pianificazione' }).click();
  await dialog.getByTestId('antivirus_scheduler_switch').click();
  await dialog.getByTestId('antivirus_bootScan_switch').click();
  await dialog.getByTestId('antivirus_bootScan_kind').selectOption('full');
  await dialog.getByTestId('antivirus_shutdownScan_switch').click();
  await dialog.getByTestId('antivirus_shutdownScan_kind').selectOption('quick');
  await dialog.getByRole('button', { name: 'Aggiungi job' }).click();
  await dialog.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const requests = await asked(page);
  expect(requests).toContainEqual([
    'antivirus-scan',
    { kind: 'file', paths: ['/srv/storage/sample.txt'] },
  ]);
  expect(requests.find(([type]) => type === 'antivirus-settings')?.[1]).toMatchObject({
    schedulerEnabled: true,
    bootScan: { enabled: true, kind: 'full' },
    shutdownScan: { enabled: true, kind: 'quick' },
    schedules: [{ kind: 'quick', time: '03:00' }],
  });
});

test('restores or deletes a file in quarantine, and turns the antivirus off from its settings', async ({
  page,
}) => {
  const app = await openInShell(page);
  await app.getByTestId('section_antivirus').click();
  await app.getByTestId('antivirus_open_settings').click();
  await app.getByRole('dialog').getByTestId('antivirus_enable').click();
  const entry = app.getByTestId('quarantine_q-eicar');
  await expect(entry).toContainText('Eicar-Test-Signature');
  await expect(entry).toContainText('/srv/storage/Documenti/eicar.com');
  await app
    .getByTestId('antivirus_quarantine')
    .screenshot({ path: '/tmp/nas-antivirus-quarantine.png' });

  await entry.getByRole('button', { name: 'Ripristina' }).click();
  await expect(app.getByRole('dialog')).toContainText('/srv/storage/Documenti/eicar.com');
  await app.getByTestId('quarantine_confirm').click();
  await expect(entry).toHaveCount(0);
  expect(await asked(page)).toContainEqual(['antivirus-restore', { id: 'q-eicar' }]);

  await app
    .getByTestId('quarantine_q-eicar-zip')
    .getByRole('button', { name: 'Elimina definitivamente' })
    .click();
  await expect(app.getByRole('dialog')).toContainText('non può essere annullata');
  await app.getByTestId('quarantine_confirm').click();
  await expect(app.getByTestId('antivirus_quarantine_empty')).toContainText(
    'La quarantena è vuota.',
  );
  expect(await asked(page)).toContainEqual(['antivirus-delete', { id: 'q-eicar-zip' }]);

  await app.getByTestId('antivirus_settings').click();
  const dialog = app.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Generale' }).click();
  await dialog.getByTestId('antivirus_disable').click();
  await expect(dialog.getByRole('alert')).toContainText('L’antivirus resta installato');
  await dialog.getByTestId('antivirus_disable_confirm').click();
  await expect(app.getByTestId('antivirus_off')).toBeVisible();
  expect(await asked(page)).toContainEqual(['antivirus-enable', { enabled: false }]);
});

test('a custom scan skips the unchanged files when asked, and the settings forget them', async ({
  page,
}) => {
  const app = await openInShell(page);
  await app.getByTestId('section_antivirus').click();
  await app.getByTestId('antivirus_open_settings').click();
  await app.getByRole('dialog').getByTestId('antivirus_enable').click();
  await expect(app.getByTestId('antivirus_scans')).toBeVisible();
  // The quick scan always skips them, and says so.
  await expect(app.getByTestId('antivirus_scans')).toContainText('Dopo 30 giorni');
  await expect(app.getByTestId('antivirus_skip_unchanged')).toHaveCount(0);
  await app.getByTestId('antivirus_kind_custom').click();
  await expect(app.getByTestId('antivirus_skip_unchanged')).not.toBeChecked();
  await app.getByTestId('antivirus_skip_unchanged_switch').click();
  await app.getByTestId('antivirus_paths').fill('/srv/storage/Documenti');
  await app.getByTestId('antivirus_scan').click();
  await expect(app.getByText('Saltati perché non modificati: 30')).toBeVisible();
  await app.getByTestId('antivirus_scans').screenshot({ path: '/tmp/nas-antivirus-skip.png' });
  expect(await asked(page)).toContainEqual([
    'antivirus-scan',
    { kind: 'custom', paths: ['/srv/storage/Documenti'], skipUnchanged: true },
  ]);

  await app.getByTestId('antivirus_settings').click();
  const dialog = app.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Scansioni' }).click();
  await expect(dialog.getByTestId('antivirus_scanned_archive')).toContainText(
    'File già controllati',
  );
  await dialog.getByTestId('antivirus_forget').click();
  await expect(dialog).toHaveCount(0);
  expect(await asked(page)).toContainEqual(['antivirus-forget', undefined]);
});
