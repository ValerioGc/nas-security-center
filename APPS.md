# Contract of nas-security-center with the NAS launcher

The contract every application shares with the launcher (package, manifest, permissions, frame
protocol, launcher socket and providers) is `docs/development/external_apps/APPS.md` in the
nas-launcher repository, and the bridge is the one of `@valeriogc/nas-base-app`. This file keeps
only what is specific to nas-security-center, which builds and releases on its own.

## Identity

- id `nas-security-center`, category `system`, system application
- permissions none beyond the template

## Specific to this application

Only nas-security-center may ask about the access of the NAS: `{ nas: 1, type, requestId, payload? }` with `type` one of `access-settings`, `save-access-settings`, `access-rules`, `add-access-rule`, `remove-access-rule`, `sign-in-policy`, `save-sign-in-policy`, `refused-sign-ins`, and for the devices allowed in with mTLS `mtls-state`, `save-mtls`, `devices`, `add-device`, `update-device`, `renew-device`, `revoke-device` and `remove-device`. Where the payload carries the account password (`save-mtls`, `add-device`, `renew-device`), the shell checks it with the gateway and never passes it on. The shell answers `{ nas: 1, type: '<type>-result', requestId, success, data?, error? }` with the console's session, after checking the payload again; a malformed request gets no answer. The payload is plain data: a reactive object does not cross `postMessage`.

Only the registered `nas-security-center` frame can request `antivirus-status`,
`antivirus-enable` (`{ enabled }`), `antivirus-settings` (the settings document),
`antivirus-scan` (`{ kind: 'full' | 'quick' | 'file' | 'custom', paths: string[], skipUnchanged?:
boolean }`), `antivirus-quarantine`, `antivirus-restore`, `antivirus-delete` (`{ id }`) and
`antivirus-forget`. Requests use the
existing `{ nas: 1, type, requestId, payload }` envelope and `<type>-result` reply.
The shell validates them and uses its authenticated launcher client. Paths are absolute NAS
paths; the existing Explorer picker remains limited to NAS storage.

ClamAV is optional, disabled by default and absent from this app's manifest packages. Enabling
requests `clamav` and `clamav-freshclam` through the same package helper as Email. The launcher
persists settings, schedules jobs using the NAS timezone, reports operation status and records
notifications even when the app is closed. Machine operations require `NAS_APPS_MODE=real`.

The scheduler settings also read the existing `power-schedule`/`power-schedule-result` bridge,
shared by all apps. Enabled jobs during scheduled off intervals cannot be saved; a shutdown
or restart within 30 minutes is shown as a warning. Unreadable rules are reported explicitly.
`bootScan` and `shutdownScan` are independent `{ enabled, kind, paths }` settings, off by
default and validated again by the launcher and native helper. Their results are queued for
launcher notifications across OS restarts. See DEVELOPMENT.md for coverage commands.

The commands that check the repository are in [DEVELOPMENT.md](DEVELOPMENT.md).
