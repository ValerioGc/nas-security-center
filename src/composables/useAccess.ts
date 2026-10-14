import { computed, ref } from 'vue';
import { askNasShell } from '@/services/nasShell';
import type {
  AccessRule,
  AccessSettings,
  DiscoverySettings,
  NewAccessRule,
  SignInPolicy,
} from '@/types';

const ATTEMPTS = { min: 1, max: 20 };
const LOCK_MINUTES = { min: 1, max: 1440 };

function within(value: number, bounds: { min: number; max: number }) {
  return Number.isInteger(value) && value >= bounds.min && value <= bounds.max;
}

function reason(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Who reaches the NAS, through the shell: the settings and the allowed addresses of the launcher,
 * the discovery by NAS Finder and the lock after failed sign-ins of the gateway. The settings and
 * the lock are saved together as they change; pending edits are kept while a save is in flight.
 * The discovery is saved on its own, since it opens or closes a port of the firewall.
 */
export function useAccess() {
  const settings = ref<AccessSettings | null>(null);
  const policy = ref<SignInPolicy | null>(null);
  const discovery = ref<DiscoverySettings | null>(null);
  const rules = ref<AccessRule[]>([]);
  const stored = ref('');
  const storedPolicy = ref('');

  const loading = ref(false);
  const error = ref('');
  const policyUnavailable = ref(false);
  const saving = ref(false);
  const ruleBusy = ref(false);
  const ruleError = ref('');
  const discoveryBusy = ref(false);
  const discoveryError = ref('');

  const settingsChanged = computed(
    () => settings.value !== null && JSON.stringify(settings.value) !== stored.value,
  );
  const policyChanged = computed(
    () => policy.value !== null && JSON.stringify(policy.value) !== storedPolicy.value,
  );
  const policyValid = computed(
    () =>
      policy.value === null ||
      (within(policy.value.attempts, ATTEMPTS) && within(policy.value.lockMinutes, LOCK_MINUTES)),
  );
  const changed = computed(
    () => (settingsChanged.value || policyChanged.value) && policyValid.value,
  );
  const restricted = computed(() => rules.value.length > 0);

  function keepSettings(value: AccessSettings) {
    settings.value = { ...value };
    stored.value = JSON.stringify(value);
  }

  function keepPolicy(value: SignInPolicy) {
    policy.value = { ...value };
    storedPolicy.value = JSON.stringify(value);
  }

  async function loadPolicy() {
    try {
      keepPolicy(await askNasShell<SignInPolicy>('sign-in-policy'));
      policyUnavailable.value = false;
    } catch {
      policy.value = null;
      policyUnavailable.value = true;
    }
  }

  async function loadDiscovery() {
    try {
      discovery.value = await askNasShell<DiscoverySettings>('discovery-settings');
      discoveryError.value = '';
    } catch (cause) {
      discovery.value = null;
      discoveryError.value = reason(cause);
    }
  }

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const [current, listed] = await Promise.all([
        askNasShell<AccessSettings>('access-settings'),
        askNasShell<AccessRule[]>('access-rules'),
        loadPolicy(),
        loadDiscovery(),
      ]);
      keepSettings(current);
      rules.value = listed;
    } catch (cause) {
      error.value = reason(cause);
    } finally {
      loading.value = false;
    }
  }

  async function saveSettings(input: AccessSettings) {
    const result = await askNasShell<AccessSettings>('save-access-settings', input);
    stored.value = JSON.stringify(result);
    if (JSON.stringify(settings.value) === JSON.stringify(input)) {
      settings.value = { ...result };
    }
  }

  async function savePolicy(input: SignInPolicy) {
    const result = await askNasShell<SignInPolicy>('save-sign-in-policy', input);
    storedPolicy.value = JSON.stringify(result);
    if (JSON.stringify(policy.value) === JSON.stringify(input)) {
      policy.value = { ...result };
    }
    policyUnavailable.value = false;
  }

  /** Saves valid changes in order, retaining edits made while an earlier request is in flight. */
  async function save() {
    if (!changed.value || saving.value) {
      return;
    }
    saving.value = true;
    error.value = '';
    try {
      while (changed.value) {
        if (settingsChanged.value && settings.value) {
          await saveSettings({ ...settings.value });
        }
        if (policyChanged.value && policy.value && policyValid.value) {
          await savePolicy({ ...policy.value });
        }
      }
    } catch (cause) {
      error.value = reason(cause);
    } finally {
      saving.value = false;
    }
  }

  /** Opens or closes the discovery; a refusal puts the switch back where the launcher has it. */
  async function saveDiscovery(enabled: boolean) {
    discoveryBusy.value = true;
    discoveryError.value = '';
    try {
      discovery.value = await askNasShell<DiscoverySettings>('save-discovery-settings', {
        enabled,
      });
    } catch (cause) {
      discovery.value = { enabled: !enabled };
      discoveryError.value = reason(cause);
    } finally {
      discoveryBusy.value = false;
    }
  }

  async function changeRules(run: () => Promise<AccessRule[]>) {
    ruleBusy.value = true;
    ruleError.value = '';
    try {
      rules.value = await run();
      return true;
    } catch (cause) {
      ruleError.value = reason(cause);
      return false;
    } finally {
      ruleBusy.value = false;
    }
  }

  const addRule = (rule: NewAccessRule) =>
    changeRules(() => askNasShell<AccessRule[]>('add-access-rule', rule));

  const removeRule = (rule: AccessRule) =>
    changeRules(() => askNasShell<AccessRule[]>('remove-access-rule', { id: rule.id }));

  return {
    settings,
    policy,
    discovery,
    rules,
    loading,
    error,
    policyUnavailable,
    saving,
    ruleBusy,
    ruleError,
    discoveryBusy,
    discoveryError,
    changed,
    policyValid,
    restricted,
    load,
    save,
    saveDiscovery,
    addRule,
    removeRule,
  };
}
