import { toRaw } from 'vue';
import { createNasShell, NasShellError } from '@valeriogc/nas-base-app';

/** Request types handled by the launcher shell. */
export type ShellRequest =
  | 'power-schedule'
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

/** Single bridge to the launcher, including its context. */
export const shell = createNasShell({ timeoutMs: TIMEOUT_MS });

/**
 * Sends a request to the launcher shell. Rejects with the reported error, or when no reply arrives
 * within `timeoutMs`.
 */
export async function askNasShell<T>(
  type: ShellRequest,
  payload?: unknown,
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
  const plain: unknown = payload === undefined ? undefined : structuredClone(toRaw(payload));
  const answer = await shell.request(type, { payload: plain }, { timeoutMs }).catch(() => {
    throw new Error('Launcher unavailable');
  });
  if (!answer.success) {
    throw new Error(answer.error ?? 'Launcher unavailable');
  }
  return answer.data as T;
}

/** Opens the Explorer picker and returns the chosen path under /srv/storage, or null. */
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
