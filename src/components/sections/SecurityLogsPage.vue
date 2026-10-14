<script setup lang="ts">

import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import { formatMoment } from '@/utils/formatMoment';
import { askNasShell } from '@/services/nasShell';
import type { AccessSettings, RefusedSignIn } from '@/types';
import { NasIcon } from '@valeriogc/nas-base-app';
import refreshIcon from '@/assets/icons/refresh.svg?url';

const { t } = useI18n();
const refused = ref<RefusedSignIn[]>([]);
const recording = ref(true);
const loading = ref(false);
const error = ref('');

const newestFirst = computed(() => [...refused.value].sort((one, other) => other.at - one.at));

/** The field the launcher names, in the language of the page; an unknown one as it came. */
function field(name: string) {
  return name === 'username' || name === 'password' ? t.value.fields[name] : name || '-';
}

/**
 * The refused sign-ins the launcher noted, and whether it is noting them at all: they are
 * recorded only while the notification for them is on.
 */
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [listed, settings] = await Promise.all([
      askNasShell<RefusedSignIn[]>('refused-sign-ins'),
      askNasShell<AccessSettings>('access-settings'),
    ]);
    refused.value = listed;
    recording.value = settings.notifyFailures;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    loading.value = false;
  }
}

onMounted(load);

</script>

<template>
  <section :aria-label="t.sections.logs">
    <header class="page_header logs_header">
      <div>
        <h1>{{ t.sections.logs }}</h1>
        <p>{{ t.logsIntro }}</p>
      </div>
      <button
        type="button"
        class="action_button"
        :disabled="loading || !recording || !refused.length"
        data-testid="logs_refresh"
        @click="load"
      >
        <NasIcon :svg="refreshIcon" />
        {{ t.refresh }}
      </button>
    </header>

    <p v-if="error" class="alert" role="alert" data-testid="logs_error">
      <span class="alert_message">{{ error }}</span>
      <button type="button" class="action_button" :disabled="loading" @click="load">
        {{ t.retry }}
      </button>
    </p>
    <p v-if="!recording" class="muted recording_off" data-testid="logs_recording_off">
      {{ t.notifyOff }}
    </p>

    <section class="surface_card">
      <output v-if="loading && !refused.length" class="empty">{{ t.loading }}</output>
      <p v-else-if="!refused.length" class="empty" data-testid="logs_empty">{{ t.noRefused }}</p>
      <div v-else class="app_scroll">
        <table data-testid="logs_table">
          <thead>
            <tr>
              <th>{{ t.when }}</th>
              <th>{{ t.from }}</th>
              <th>{{ t.wrongField }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in newestFirst" :key="entry.id">
              <td>{{ formatMoment(entry.at) }}</td>
              <td class="address">{{ entry.from || '-' }}</td>
              <td>{{ field(entry.field) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped lang="scss">

.logs_header {
  @extend %fx_between;
  gap: 16px;
}

.alert,
.recording_off {
  margin-bottom: 16px;
}

.empty {
  display: block;
  margin: 0;
  padding: 48px 24px;
  color: var(--nas-muted);
  text-align: center;
}

th,
td {
  padding: 14px 24px;
  font-size: 13px;
}

th {
  color: var(--nas-muted);
  background: var(--table-heading-bg);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

tr:last-child td {
  border-bottom: 0;
}

.address {
  font-family: ui-monospace, monospace;
}

</style>
