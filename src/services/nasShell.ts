import { toRaw } from 'vue';
import { createNasShell, NasShellError } from '@valeriogc/nas-base-app';

/**
 * The conversation with the shell of the launcher, which holds this application in a frame. The
 * application never reaches the launcher or the gateway: it asks the shell, which answers with the
 * session of the console. The bridge of the library takes messages only from the parent window,
 * on this same origin.
 */

/** What only the launcher holds, asked through the shell. */
export type ShellRequest =
  | 'power-schedule'
  | 'pick-files'
  | 'antivirus-status'
  | 'antivirus-enable'
  | 'antivirus-settings'
  | 'antivirus-scan'
  | 'antivirus-quarantine'
  | 'antivirus-restore'
  | 'antivirus-delete'
  | 'antivirus-forget'
  | 'mtls-state'
  | 'save-mtls'
  | 'devices'
  | 'add-device'
  | 'update-device'
  | 'renew-device'
  | 'revoke-device'
  | 'remove-device'
  | 'access-settings'
  | 'save-access-settings'
  | 'discovery-settings'
  | 'save-discovery-settings'
  | 'access-rules'
  | 'add-access-rule'
  | 'remove-access-rule'
  | 'sign-in-policy'
  | 'save-sign-in-policy'
  | 'refused-sign-ins'
  | 'certificate'
  | 'https-settings'
  | 'save-https-settings'
  | 'save-certificate-names'
  | 'renew-certificate'
  | 'upload-certificate'
  | 'remove-custom-certificate';

const TIMEOUT_MS = 10000;

/** The one bridge of the application to the launcher, its context included. */
export const shell = createNasShell({ timeoutMs: TIMEOUT_MS });

/**
 * Asks the shell for what only the launcher holds. Rejects with the reason it gives, or after
 * `timeoutMs` without an answer, ten seconds unless said otherwise; outside the launcher there is
 * nobody to ask.
 */
export async function askNasShell<T>(
  type: ShellRequest,
  payload?: unknown,
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
  // Plain data only: a reactive object of the page cannot cross postMessage, so the copy starts
  // from the object behind it.
  const plain: unknown = payload === undefined ? undefined : structuredClone(toRaw(payload));
  const answer = await shell.request(type, { payload: plain }, { timeoutMs }).catch(() => {
    throw new Error('Launcher unavailable');
  });
  if (!answer.success) {
    throw new Error(answer.error ?? 'Launcher unavailable');
  }
  return answer.data as T;
}

/** Uses the existing Explorer picker; its paths are logical relative to /srv/storage. */
export async function pickAntivirusPath(folder = false): Promise<string | null> {
  const result = await shell
    .pickFiles({ folder, multiple: false, timeoutMs: 120000 })
    .catch((error: unknown) => {
      throw new Error(
        error instanceof NasShellError && error.code === 'launcher-error'
          ? error.message
          : 'Launcher unavailable',
      );
    });
  if (result.error) {
    throw new Error(result.error);
  }
  if (result.cancelled || !result.files.length) {
    return null;
  }
  const path = result.files[0]?.path;
  if (!path?.startsWith('/') || path.split('/').includes('..')) {
    throw new Error('invalid picker path');
  }
  return `/srv/storage${path}`;
}
