import { computed, ref } from 'vue';
import { useI18n } from '@/i18n';
import { readCertificate } from '@/services/certificates';
import type { ServerCertificate } from '@/types';
import { failureMessage } from '@/utils/failureMessage';

/** Whether `names` covers `host`, a `*.` name covering one level below it. */
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
 * The certificates section: the certificate in use, and what the browser that opened the page
 * should know about it. Every change comes back as the new state, through `apply`.
 */
export function useCertificate() {
  const { t } = useI18n();
  const state = ref<ServerCertificate | null>(null);
  const loading = ref(false);
  const error = ref('');

  // The address the browser reached the NAS with: what the certificate has to cover.
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

  /** Runs a change and keeps the state it answers with; throws the reason it was refused. */
  async function apply(change: () => Promise<ServerCertificate>) {
    state.value = await change();
  }

  return { state, loading, error, host, https, covered, load, apply };
}
