import { ref } from 'vue';
import { useI18n } from '@/i18n';
import { listDevices, readMtls, saveMtls } from '@/services/devices';
import type { Device, MtlsState } from '@/types';
import { failureMessage } from '@/utils/failureMessage';

/**
 * State of the devices section with mTLS status and device list. Modals report changes through
 * `keep` and `drop`, so the list is updated without a reload.
 */
export function useDevices() {
  const { t } = useI18n();
  const devices = ref<Device[]>([]);
  const mtls = ref<MtlsState | null>(null);
  const loading = ref(false);
  const error = ref('');

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const [state, listed] = await Promise.all([readMtls(), listDevices()]);
      mtls.value = state;
      devices.value = listed;
    } catch (cause) {
      error.value = failureMessage(cause, t.value);
    } finally {
      loading.value = false;
    }
  }

  /** Replaces a changed device in place, or appends a new one. */
  function keep(device: Device) {
    const index = devices.value.findIndex((item) => item.id === device.id);
    if (index < 0) {
      devices.value.push(device);
    } else {
      devices.value.splice(index, 1, device);
    }
  }

  function drop(id: number) {
    devices.value = devices.value.filter((device) => device.id !== id);
  }

  /** Toggles mTLS with the account password. Throws when the change is refused. */
  async function switchMtls(enabled: boolean, password: string) {
    mtls.value = await saveMtls(enabled, password);
  }

  return { devices, mtls, loading, error, load, keep, drop, switchMtls };
}
