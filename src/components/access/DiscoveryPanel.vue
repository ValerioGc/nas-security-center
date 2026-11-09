<script setup lang="ts">

import { computed } from 'vue';
import { useI18n } from '@/i18n';
import type { DiscoveryStatus } from '@/types';
import { NasSwitch } from '@valeriogc/nas-base-app';

interface Props {
  status: DiscoveryStatus | null;
  busy: boolean;
}

const props = defineProps<Props>();
const enabled = defineModel<boolean>({ required: true });

const { t } = useI18n();

const silent = computed(() => enabled.value && props.status?.listening === false);
const notApplied = computed(() => props.status?.applied === false);

const state = computed(() => {
  if (silent.value || notApplied.value) {
    return 'problem';
  }

  return enabled.value ? 'active' : 'off';
});

const port = computed(() => String(props.status?.port ?? ''));

const responder = computed(() => {
  const listening = props.status?.listening;
  if (listening === null || listening === undefined) {
    return t.value.discoveryUnknown;
  }

  return listening ? t.value.discoveryListening : t.value.discoverySilent;
});

const firewall = computed(() => {
  const applied = props.status?.applied;
  if (applied === false) {
    return t.value.discoveryNotApplied;
  }
  if (applied === null || applied === undefined) {
    return t.value.discoveryUnknown;
  }

  return enabled.value ? t.value.discoveryOpen : t.value.discoveryClosed;
});

</script>

<template>
  <div class="discovery_head">
    <NasSwitch
      v-model="enabled"
      :label="t.discovery"
      :disabled="busy"
      testid="access_discovery_enabled"
    />
    <span
      class="discovery_state"
      :class="`discovery_state_${state}`"
      data-testid="access_discovery_state"
    >
      {{ t.discoveryStates[state] }}
    </span>
  </div>
  <p class="muted">{{ t.discoveryNote }}</p>

  <dl
    v-if="status"
    class="discovery_details"
    :aria-label="t.discoveryDetails"
    data-testid="access_discovery_details"
  >
    <div class="discovery_detail">
      <dt>{{ t.discoveryPort }}</dt>
      <dd data-testid="access_discovery_port">
        <code>{{ t.discoveryPortValue.replace('{port}', port) }}</code>
      </dd>
    </div>
    <div class="discovery_detail">
      <dt>{{ t.discoveryScope }}</dt>
      <dd>{{ t.discoveryScopeValue }}</dd>
    </div>
    <div class="discovery_detail" :class="{ discovery_detail_problem: silent }">
      <dt>{{ t.discoveryResponder }}</dt>
      <dd data-testid="access_discovery_responder">{{ responder }}</dd>
    </div>
    <div class="discovery_detail" :class="{ discovery_detail_problem: notApplied }">
      <dt>{{ t.discoveryFirewall }}</dt>
      <dd data-testid="access_discovery_firewall">{{ firewall }}</dd>
    </div>
  </dl>

  <p v-if="silent" class="alert alert_warning" role="note" data-testid="access_discovery_silent">
    {{ t.discoverySilentNote.replace('{port}', port) }}
  </p>
  <p
    v-if="notApplied"
    class="alert alert_warning"
    role="note"
    data-testid="access_discovery_not_applied"
  >
    {{ t.discoveryNotAppliedNote }}
  </p>
</template>

<style scoped lang="scss">

.discovery_head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.discovery_state {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--status-off-bg);
  color: var(--status-off-color);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.discovery_state_active {
  background: var(--status-bg);
  color: var(--status-color);
}

.discovery_state_problem {
  background: color-mix(in srgb, var(--tone-warning) 15%, var(--nas-surface));
  color: var(--tone-warning);
}

.discovery_details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: 10px;
  margin: 0;
}

.discovery_detail {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--nas-border);
  border-radius: 9px;
  background: var(--nas-sunken);

  dt {
    color: var(--nas-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  code {
    font-size: 14px;
  }
}

.discovery_detail_problem {
  border-color: color-mix(in srgb, var(--tone-warning) 55%, var(--nas-border));

  dd {
    color: var(--tone-warning);
  }
}

</style>
