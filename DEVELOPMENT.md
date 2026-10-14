# Development of nas-security-center

The Vue/TypeScript UI is in `src/`; the Rust/Axum backend, which serves only the interface and
`/health`, is in `backend/axum/`. The shared scripts are in the library `@valeriogc/nas-base-app`;
manifest and version are in `nas-app.json`, `package.json` and the Cargo metadata.
`src/assets/logo.svg` is the source of the logo and the UI icons are in `src/assets/icons/`.

## Structure

```text
src/
  App.vue                       # Sidebar and chosen section
  components/layout/            # AppSidebar
  components/sections/          # AccessPage, DevicesPage, SecurityLogsPage
  components/access/            # AllowedAddresses: list, addition and removal
  components/modals/            # Details and new device
  components/devices/           # MtlsPanel, DeviceIconPicker, CredentialPanel, PasswordConfirm
  components/common/            # CommonModal (on NasModal), EmptyState
  composables/useAccess.ts      # State and actions of the Access section
  composables/useDevices.ts     # mTLS state and list of the devices
  composables/useNasLauncherContext.ts # The context of the library with the catalogue of the app
  services/nasShell.ts          # The conversation with the shell (askNasShell) on the bridge of the library
  services/devices.ts           # The requests about the devices
  utils/deviceIcons.ts          # The symbol of every kind of device
  types.ts
```

## How it talks to the launcher

All data goes through `askNasShell(type, payload)`: a message to the shell with a `requestId`, to
which the shell answers with `<type>-result`. The requests are `access-settings`,
`save-access-settings`, `access-rules`, `add-access-rule`, `remove-access-rule`,
`sign-in-policy`, `save-sign-in-policy` and `refused-sign-ins`, and for the devices `mtls-state`,
`save-mtls`, `devices`, `add-device`, `update-device`, `renew-device`, `revoke-device` and
`remove-device`. Those carrying the password of the account wait up to 30 seconds: the shell
checks it with the gateway, which then creates key and certificate file. The launcher accepts
them only from the frame of `nas-security-center` (`src/api/access.ts` and
`src/api/securityDevices.ts` in the launcher), checks them again and uses the same API as the
console. The `payload` travels as plain data: a reactive Vue object does not pass through
`postMessage`. `openHttps()` of the bridge (message `open-https`) asks the launcher to load itself
again over HTTPS: the frame guard forbids the app to navigate the console.

## Conventions

Composition API with `<script setup lang="ts">`, imports through the `@/` alias, scoped SFC styles,
CSS names with `_` and UI texts in the catalogues `src/i18n/locales/en.ts` and `it.ts`, with the
same keys. Code, method names, test descriptions, this document and the README are in English.

The FE tests are in `src/tests/unit`, `component`, `scripts`, `e2e`, with sub-paths mirroring
`src/`. The e2e tests open the app inside a fake shell (`openInShell`) that answers the requests
like the launcher. The Rust tests are in `backend/tests/unit`.

## Coverage

The threshold is 80% on every file of the frontend, components included (`perFile` in
`vitest.config.ts`), and 80% of the lines of the Rust backend (`--fail-under-lines 80` passed to
`cargo llvm-cov` in the `coverage:rust` command of `package.json`).

## Dependencies and lockfiles

Locally dependencies are installed with pnpm; the pipelines install with `npm ci` from
`package-lock.json`, which therefore has to match `package.json`. `pnpm install` realigns it by
itself (`postinstall`); `pnpm add`, `pnpm update` and `pnpm remove` do not: after them run
`pnpm run lock:npm`. `pnpm run lint` checks the alignment. `pnpm-lock.yaml` stays local.

## Shared library

The launcher bridge, styles, shared components and helpers, and the build, package and release scripts come from `@valeriogc/nas-base-app`, published on GitHub Packages; the commands of `package.json` use its `nas-base-app`. The `.npmrc` of the project points the `@valeriogc` scope to its registry; locally a classic token with `read:packages` is needed in your own `~/.npmrc` (`//npm.pkg.github.com/:_authToken=...`), while the pipelines use the token of the workflow. For a new version of the library, update the number in `package.json` and run `pnpm install`. The local `pnpm-workspace.yaml` has `'@valeriogc/nas-base-app': false` under `allowBuilds`.

## Checks

```bash
pnpm install
pnpm run format:check
pnpm run lint
pnpm run type-check
pnpm test
pnpm run test:e2e
pnpm run test:coverage
pnpm run coverage:rust
cargo fmt --manifest-path backend/Cargo.toml --all --check
cargo clippy --manifest-path backend/Cargo.toml --all-targets -- -D warnings
cargo test --locked --manifest-path backend/Cargo.toml
pnpm run nas:package
pnpm run nas:test
```

The E2E tests start Vite on port 1436. `release:merge` creates commit and tag: try it only in an
isolated temporary Git repository.

The Access options are saved when they change, with no Save button. The requests are serialized to
keep also the changes made during a save. "Add device" follows the mTLS checkbox: before the first
certificate the selection prepares the configuration, without turning on the check of the gateway
yet. The actual activation requires HTTPS, a valid certificate and the confirmation of the
password.

## Antivirus

The UI stays a client of the shell: `useAntivirus` polls `antivirus-status` and forwards
`antivirus-enable`, `antivirus-settings`, `antivirus-scan` (with `skipUnchanged` for the custom
scan, when its box is ticked), `antivirus-quarantine`, `antivirus-restore`, `antivirus-delete` and
`antivirus-forget` (from the "Files already checked" card of the Scans tab). The actions answer
at once that they were taken in charge; the state is read again every two seconds and the polling
stops when the page closes. `AntivirusSettingsModal` edits a copy and saves it explicitly; the
General tab emits `toggle`, which the page forwards as `antivirus-enable`, closing the window to
show the progress. `ScanOptionsForm` reuses `NasSwitch` and `NasNumberStepper` of the library for
every kind, in one card per kind in the Scans tab. `ScanKindPicker` chooses the kind with hidden
radios in cards, `OperationProgress` draws the operation in progress (`role="progressbar"`, with a
moving band when the progress is unknown), `EmptyState` the placeholders of loading and of empty
lists. The e2e tests start with two EICAR files in quarantine, to try their view, restore and
deletion. The existing picker answers logical paths, converted into absolute paths under
`/srv/storage`, without downloading the files into the browser.

The launcher keeps the settings in SQLite and starts ClamAV from a dedicated unit. No package is
added to the manifest of the preinstalled app: they are requested only when it is enabled. The
full scan starts from `/`; the quick one uses `/home`, `/tmp`, `/var/tmp`, editable in the
settings. Archives, PUA, the file limit and the exclusions are independent for every kind. The
exclusions are literal paths, not regular expressions. ClamAV keeps its own scan limits; virtual
filesystems, internal state and symbolic links are excluded. The UI shows an indeterminate
progress where the tool gives no percentages.

Schedule and notifications belong to the launcher, so they do not depend on the iframe. A job that
overlaps an operation is skipped and notified. The quarantine is private to root: a textual result
is checked again by ClamAV before the file is isolated; the restore keeps the ordinary owner and
permissions and does not overwrite existing files.

The Schedule tab reads `power-schedule` from the shared protocol of the launcher and reuses the
weekly computation of the Backup Manager: it forbids saving active jobs during a scheduled
shutdown and warns about a shutdown or restart within 30 minutes, even across midnight. The rules
are read again every time the window opens. If they cannot be read, the limit is reported and the
settings can still be saved. The 30 minutes are a warning window, not an estimate of the length of
the scan.

`bootScan` and `shutdownScan` each have `enabled`, `kind` and `paths`, are off by default and use
the options of their kind. The optional unit `nas-os-antivirus-lifecycle.service` runs the scans
only at the start of the OS or at its shutdown/restart; a restart of the launcher does not
trigger them. Before the scan at boot the mount helper of the volumes is reused. The scans are
serialized through flock. The shutdown waits for the scan up to the 24-hour limit; the results
reach the notifications of the launcher at the next start, without duplicates when the launcher
starts again.

`pnpm run test:coverage` enforces 80% of lines, functions, branches and statements for every
frontend file. In the `nas-launcher` repository, `pnpm run coverage:antivirus` also measures the
Rust controller, orchestration, scheduler, types and executor and enforces 80% of lines and
functions per file; the reports are in `backend/coverage/antivirus-{lcov.info,summary.json}`. The
tests of the executor use isolated directories and fake processes that follow the ClamAV
contract: they install no package, drive no real service and do not replace a test on Debian with
ClamAV.
