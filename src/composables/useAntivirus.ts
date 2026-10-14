import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import { askNasShell } from '@/services/nasShell';
import type { AntivirusSettings, AntivirusStatus, ScanKind } from '@/types';
import type { ShellRequest } from '@/services/nasShell';
import { failureMessage } from '@/utils/failureMessage';

export function useAntivirus() {
  const { t } = useI18n();
  const status = ref<AntivirusStatus | null>(null);
  const error = ref('');
  const pending = ref(false);
  const busy = computed(() => pending.value || Boolean(status.value?.operation.phase));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  async function load() {
    try {
      const result = await askNasShell<AntivirusStatus>('antivirus-status');
      if (!disposed) {
        status.value = result;
      }
    } catch (error_) {
      if (!disposed) {
        error.value = failureMessage(error_, t.value);
      }
    }
  }
  async function poll() {
    await load();
    if (!disposed) {
      timer = setTimeout(() => void poll(), 2000);
    }
  }
  async function action(type: ShellRequest, payload: unknown) {
    if (busy.value) {
      return false;
    }
    pending.value = true;
    error.value = '';
    try {
      await askNasShell(type, payload);
      await load();
      return true;
    } catch (error_) {
      error.value = failureMessage(error_, t.value);
      return false;
    } finally {
      pending.value = false;
    }
  }
  onMounted(() => void poll());
  onUnmounted(() => {
    disposed = true;
    clearTimeout(timer);
  });
  return {
    status,
    error,
    busy,
    load,
    enable: (enabled: boolean) => action('antivirus-enable', { enabled }),
    scan: (kind: ScanKind, paths: string[], skipUnchanged = false) =>
      action('antivirus-scan', skipUnchanged ? { kind, paths, skipUnchanged } : { kind, paths }),
    save: (settings: AntivirusSettings) => action('antivirus-settings', settings),
    quarantine: (id: string) => action('antivirus-quarantine', { id }),
    restore: (id: string) => action('antivirus-restore', { id }),
    remove: (id: string) => action('antivirus-delete', { id }),
    forget: () => action('antivirus-forget', undefined),
  };
}
