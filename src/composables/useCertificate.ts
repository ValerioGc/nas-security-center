import { computed, ref } from 'vue';
import { useI18n } from '@/i18n';
import { readCertificate } from '@/services/certificates';
import type { ServerCertificate } from '@/types';
import { failureMessage } from '@/utils/failureMessage';

/** Whether `names` covers `host`. A `*.` wildcard matches exactly one label. */
export function covers(names: string[], host: string) {
  const wanted = host.toLowerCase();
  return names.some((name) => {
    const own = name.toLowerCase();
    if (own.startsWith('*.')) {
      const parent = own.slice(2);
      return wanted.endsWith(`.${parent}`) && !wanted.slice(0, -parent.length - 1).includes('.');
    }
    return own === wanted;
  });
}

/**
 * State of the certificates section and whether the certificate covers the current host. Changes
 * go through `apply`, which stores the returned state.
 */
export function useCertificate() {
  const { t } = useI18n();
  const state = ref<ServerCertificate | null>(null);
  const loading = ref(false);
  const error = ref('');

  // The certificate has to cover the host used by the browser.
  const host = window.location.hostname;
  const https = window.location.protocol === 'https:';
  const covered = computed(() => !state.value?.active || covers(state.value.active.names, host));

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      state.value = await readCertificate();
    } catch (cause) {
      error.value = failureMessage(cause, t.value);
    } finally {
      loading.value = false;
    }
  }

  /** Runs a change and stores the returned state. Throws when the change is refused. */
  async function apply(change: () => Promise<ServerCertificate>) {
    state.value = await change();
  }

  return { state, loading, error, host, https, covered, load, apply };
}
