# NAS package of nas-security-center

Stable identity: `nas-security-center`. The launcher installs the archive produced by
`pnpm run nas:package`, serves it under `/apps/nas-security-center/` and starts the backend over a
Unix socket. The manifest `nas-app.json` declares executable, socket, logo and protocol, and no
path: the app reads nothing of the machine. The source logo `src/assets/logo.svg` becomes
`icon.svg` in the archive. `pnpm run nas:test` extracts the archive into an isolated directory and
checks UI, `/health`, version and the absence of TCP listeners.

The catalogue of the launcher marks it `preinstall`: the NAS installs it with the first
configuration.

The workflows are `.github/workflows/ci.yml`, `build.yml`, `audit.yml` and `.github/dependabot.yml`.
A release requires consistent versions in `package.json`, the npm lock, manifest, Cargo, Sonar and
changelog. The shared details and the iframe protocol are in [APPS.md](APPS.md).

The Antivirus page also requires a launcher updated with the antivirus API, the unit
`nas-os-antivirus.service` and the polkit rule `57-nas-os-antivirus.rules`. Installing the app
alone neither installs nor enables ClamAV. The optional packages come from the Debian manager of the
launcher after they are explicitly enabled on the page; scans run on the machine, never in the
backend of the app or in the browser.

Scans at boot and at shutdown also need `nas-os-antivirus-lifecycle.service`, copied by the updated
installer and enabled only while the antivirus is on and at least one of the two options is
selected. Both options can be configured by kind of scan and paths. Shutdown and restart wait for
the scan, up to 24 hours. A failed scan at boot is notified and leaves the one at shutdown active. A
forced stop or a power loss leaves no room for a final scan.
