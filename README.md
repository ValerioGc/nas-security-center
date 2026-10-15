# nas-security-center

External application for the NAS launcher, preinstalled: it gathers in one place who can reach the
NAS and how.

- **Antivirus**: graphical client for ClamAV, off at first. Enabling it installs `clamav` and
  `clamav-freshclam` through the same Debian package manager used by Email, shows the real
  progress of apt and downloads the signatures. Full, quick, single-file or custom scans, chosen
  from selectable cards and started with a button; files and folders chosen through Explorer or as
  absolute paths. The quick scan skips the files found clean and not changed since, the custom one
  does so when its box is ticked; after 30 days a file is checked again. The settings icon, on the
  right of the title, opens the tabs General (turning on and off, with confirmation), Schedule,
  Scans (one card per kind, plus "Files already checked" to forget them) and Quarantine; while off
  it shows General only. The jobs follow the time zone of the NAS and work with the app closed too.
  Quarantine is manual at first, with an automatic option, restore without overwriting and
  permanent deletion with confirmation. Results, threats and errors produce notifications of the
  launcher. Turning it off stops FreshClam and the jobs, keeping packages and quarantine.
- **Access**: notification of refused sign-ins, blocking of the address after failed attempts,
  discovery on the network by NAS Finder (UDP 39877, off after the wizard) and allowed addresses
  (single or CIDR ranges). The rules apply to the whole NAS: the launcher applies them, even with
  the app closed, and the blocking of attempts belongs to the gateway.
- **Security logs**: the refused sign-ins the launcher records while the notification is on.
- **Devices**: access with a certificate only (mTLS) and the allowed devices, each with name, icon
  and certificate. From here a device is added, downloading its certificate and the authority of
  the NAS, and renewed, revoked or removed. Issuing a certificate and changing mTLS ask for the
  password of the account again; the device in use, with mTLS on, cannot lock itself out.
- **Certificates**: the certificate the NAS answers HTTPS with (who signs it, covered addresses,
  validity, fingerprint) and the authority of the NAS, with its download and a guide, system by
  system, to make it trusted. The page says why the browser marks the connection as not secure:
  page opened over HTTP, address in use not covered by the certificate, or authority not
  installed. Over HTTP a button asks the launcher to open again over HTTPS. Addresses can be added
  (a domain, a dynamic name, a VPN, a forward), a new certificate issued at once, a custom one
  uploaded in PEM with its key (for example Let's Encrypt), and the NAS's own restored. Every change
  asks for the password of the account and applies from the next connection, without restarts.
  The HTTPS port (443 by default) and the **Force HTTPS** switch are saved separately: changing
  either preserves the current certificate, including custom certificates, and the NAS authority.
  An occupied port is rejected before replacing the listener. HTTP access redirects to the selected
  HTTPS port when enforced; the physical screen and local health checks keep their local access.

The wizard creates only the account with its password and the CA for HTTPS. To turn mTLS on after
signing in, first select the access with a certificate, then add the first device, import its
`.p12` into the browser with the shown password, open the NAS over HTTPS and turn the option on,
confirming the password of the account. The gateway refuses the activation if the browser shows no
valid certificate.

The app has no permissions on the system and never reaches the launcher or the gateway: it asks the
shell, which answers with the session of the console and accepts these requests from this app
only. Every repository stands on its own and produces an archive the launcher can install.

## Local start

Requires Node.js 24, pnpm and Rust/Cargo.

```bash
pnpm install
pnpm run build
pnpm run backend:dev
```

In a second terminal:

```bash
pnpm run dev
```

Vite serves the UI on `http://127.0.0.1:1420/`. Opened on its own, outside the shell, the page says
the launcher does not answer: all its functions go through the shell. The backend serves only the
interface and `/health`.

For structure, tests and checks see [DEVELOPMENT.md](DEVELOPMENT.md). The contract for installation
and communication with the launcher is in [APPS.md](APPS.md); packaging and release are in
[NAS.md](NAS.md).

In the Antivirus settings, the schedule also checks the power rules of the NAS: it forbids the
times when it is off and warns about shutdowns or restarts within 30 minutes. Two independent
options allow scans at boot and at shutdown of the system, each with configurable kind and paths.
They are off by default. The shutdown waits for the scan (up to 24 hours); the results are notified
at the next start of the launcher.
