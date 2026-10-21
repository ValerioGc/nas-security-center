<script setup lang="ts">

import { computed, ref } from 'vue';
import { pickAntivirusPath } from '@/services/nasShell';
import { failureMessage } from '@/utils/failureMessage';
import { useI18n } from '@/i18n';
import { useAntivirus } from '@/composables/useAntivirus';
import type { AntivirusSettings, QuarantineEntry, ScanKind } from '@/types';
import { NasIcon, NasSwitch } from '@valeriogc/nas-base-app';

import antivirusIcon from '@/assets/icons/antivirus.svg?url';
import settingsIcon from '@/assets/icons/settings.svg?url';

import CommonModal from '@/components/common/CommonModal.vue';
import AntivirusSettingsModal from '@/components/antivirus/AntivirusSettingsModal.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import OperationProgress from '@/components/antivirus/OperationProgress.vue';
import ScanKindPicker from '@/components/antivirus/ScanKindPicker.vue';
import { formatMoment } from '@/utils/formatMoment';

const { t } = useI18n();
const { status, error, busy, enable, scan, save, quarantine, restore, remove, forget, load } =
  
useAntivirus();

const settingsOpen = ref(false);

const activating = computed(() =>
  ['installing', 'updating', 'resuming'].includes(status.value?.operation.phase ?? ''),
);

const preparing = computed(
  () =>
    activating.value &&
    (status.value?.operation.phase !== 'installing' ||
      (status.value?.operation.progress ?? 0) >= 100),
);

const picking = ref(false);

async function choosePath(folder: boolean) {
  picking.value = true;
  try {
    const path = await pickAntivirusPath(folder);
    if (path) {
      paths.value = selected.value === 'file' ? path : [...scanPaths(), path].join('\n');
    }
  } catch (error_) {
    error.value = failureMessage(error_, t.value);
  } finally {
    picking.value = false;
  }
}

const selected = ref<ScanKind>('quick');

const paths = ref('');

const skipUnchanged = ref(false);
const confirmation = ref<null | { action: 'restore' | 'delete'; entry: QuarantineEntry }>(null);
const confirmationOpen = ref(false);

async function saveSettings(settings: AntivirusSettings) {
  if (await save(settings)) {
    settingsOpen.value = false;
  }
}

async function forgetScanned() {
  if (await forget()) {
    settingsOpen.value = false;
  }
}

async function toggle(enabled: boolean) {
  if (await enable(enabled)) {
    settingsOpen.value = false;
  }
}

function phaseLabel(phase: string) {
  return (
    t.value.antivirus.phases[phase as keyof typeof t.value.antivirus.phases] || t.value.loading
  );
}

function scanPaths() {
  return paths.value
    .split('\n')
    .map((path) => path.trim())
    .filter(Boolean);
}

function startScan() {
  const defaults = selected.value === 'custom' ? (status.value?.settings.custom.paths ?? []) : [];
  let requestedPaths: string[] = [];
  if (selected.value === 'file' || selected.value === 'custom') {
    const enteredPaths = scanPaths();
    requestedPaths = enteredPaths.length ? enteredPaths : defaults;
  }

  void scan(selected.value, requestedPaths, selected.value === 'custom' && skipUnchanged.value);
}

function confirm(action: 'restore' | 'delete', entry: QuarantineEntry) {
  confirmation.value = { action, entry };
  confirmationOpen.value = true;
}

async function confirmed() {
  if (!confirmation.value) {
    return;
  }

  const { action, entry } = confirmation.value;
  if (await (action === 'restore' ? restore(entry.detection.id) : remove(entry.detection.id))) {
    confirmationOpen.value = false;
  }
}

</script>
s
<template>
  <section :aria-label="t.sections.antivirus">
    <header class="page_header antivirus_header">
      <div>
        <h1>{{ t.sections.antivirus }}</h1>
        <p>{{ t.antivirus.intro }}</p>
      </div>
      <button
        v-if="status"
        type="button"
        class="icon_button settings_button"
        :disabled="activating"
        :aria-label="t.antivirus.settings"
        :title="t.antivirus.settings"
        data-testid="antivirus_settings"
        @click="settingsOpen = true"
      >
        <NasIcon :svg="settingsIcon" />
      </button>
    </header>
    <div v-if="error || status?.operation.error" class="alert antivirus_alert" role="alert">
      <span class="alert_message">{{ error || status?.operation.error }}</span>
      <button type="button" class="action_button" @click="load">{{ t.retry }}</button>
    </div>
    <EmptyState
      v-if="!status && !error"
      loading
      :title="t.antivirus.loadingStatus"
      testid="antivirus_loading"
    />
    <template v-if="status">
      <OperationProgress
        v-if="status.operation.phase && !preparing"
        class="antivirus_operation"
        :label="t.antivirus.progress"
        :phase="phaseLabel(status.operation.phase)"
        :progress="status.operation.progress"
        :detail="
          status.operation.phase === 'scanning'
            ? `${t.antivirus.scanned}: ${status.report.scanned}${
                status.report.planned ? ` / ${status.report.planned}` : ''
              }`
            : undefined
        "
      />
      <EmptyState
        v-if="preparing"
        loading
        :title="t.antivirus.preparing"
        :text="phaseLabel(status.operation.phase)"
        testid="antivirus_preparing"
      />
      <EmptyState
        v-else-if="!activating && !status.settings.enabled"
        :svg="antivirusIcon"
        :title="t.antivirus.disabled"
        :text="t.antivirus.disabledNote"
        testid="antivirus_off"
      >
        <button
          type="button"
          class="action_button primary"
          :disabled="busy"
          data-testid="antivirus_open_settings"
          @click="settingsOpen = true"
        >
          <NasIcon :svg="settingsIcon" />
          {{ t.antivirus.openSettings }}
        </button>
      </EmptyState>

      <template v-else-if="!activating">
        <div class="surface_card page_panel" data-testid="antivirus_scans">
          <h2>{{ t.antivirus.scan }}</h2>
          <ScanKindPicker v-model="selected" :disabled="busy" />
          <label v-if="selected === 'file' || selected === 'custom'" class="field"
            >{{ t.antivirus.paths
            }}<textarea
              v-model="paths"
              name="paths"
              rows="3"
              :placeholder="t.antivirus.pathsHint"
              :disabled="busy"
              data-testid="antivirus_paths"
            ></textarea>
          </label>
          <NasSwitch
            v-if="selected === 'custom'"
            v-model="skipUnchanged"
            :label="t.antivirus.skipUnchanged"
            :disabled="busy"
            testid="antivirus_skip_unchanged"
          />
          <p v-if="selected === 'quick' || (selected === 'custom' && skipUnchanged)" class="muted">
            {{ t.antivirus.incrementalNote }}
          </p>
          <div class="app_toolbar scan_actions">
            <template v-if="selected === 'file' || selected === 'custom'">
              <button
                type="button"
                class="action_button"
                :disabled="busy || picking"
                @click="choosePath(false)"
              >
                {{ t.antivirus.chooseFile }}
              </button>
              <button
                v-if="selected === 'custom'"
                type="button"
                class="action_button"
                :disabled="busy || picking"
                @click="choosePath(true)"
              >
                {{ t.antivirus.chooseFolder }}
              </button>
            </template>
            <button
              type="button"
              class="action_button primary scan_start"
              :disabled="
                busy ||
                (selected === 'file' && scanPaths().length !== 1) ||
                (selected === 'custom' &&
                  !scanPaths().length &&
                  !status.settings.custom.paths.length)
              "
              data-testid="antivirus_scan"
              @click="startScan"
            >
              {{ t.antivirus.startScan }}
            </button>
          </div>
        </div>

        <div v-if="status.report.at" class="surface_card page_panel">
          <h2>{{ t.antivirus.result }}</h2>
          <p class="muted">
            {{ formatMoment(status.report.at) }} · {{ t.antivirus.scanned }}:
            {{ status.report.scanned }} · {{ t.antivirus.found }}: {{ status.report.found }}
            
            <template v-if="status.report.skipped">
              · {{ t.antivirus.skipped }}: {{ status.report.skipped }}
            </template>
          </p>
          <p v-if="status.report.error" class="alert" role="alert">{{ status.report.error }}</p>
          <EmptyState
            v-else-if="!status.report.found && !busy"
            :svg="antivirusIcon"
            :title="t.antivirus.clean"
            testid="antivirus_clean"
          />
          <ul v-if="status.report.detections.length" class="threat_list">
            <li v-for="detection in status.report.detections" :key="detection.id" class="threat">
              <span class="threat_text">
                <strong>{{ detection.threat }}</strong>
                <code>{{ detection.path }}</code>
              </span>
              <button
                type="button"
                class="action_button"
                :disabled="busy"
                @click="quarantine(detection.id)"
              >
                {{ t.antivirus.moveToQuarantine }}
              </button>
            </li>
          </ul>
        </div>
        <div class="surface_card page_panel" data-testid="antivirus_quarantine">
          <h2>{{ t.antivirus.quarantine }}</h2>
          <p class="muted">{{ t.antivirus.quarantineNote }}</p>
          <EmptyState
            v-if="!status.report.quarantine.length"
            :svg="antivirusIcon"
            :title="t.antivirus.emptyQuarantine"
            :text="t.antivirus.emptyQuarantineNote"
            testid="antivirus_quarantine_empty"
          />
          <ul v-else class="threat_list">
            <li
              v-for="entry in status.report.quarantine"
              :key="entry.detection.id"
              class="threat"
              :data-testid="`quarantine_${entry.detection.id}`"
            >
              <span class="threat_text">
                <strong>{{ entry.detection.threat }}</strong>
                <code>{{ entry.detection.path }}</code>
                <small>{{ formatMoment(entry.at) }}</small>
              </span>
              <span class="app_toolbar">
                <button
                  type="button"
                  class="action_button"
                  :disabled="busy"
                  @click="confirm('restore', entry)"
                >
                  {{ t.antivirus.restore }}</button
                ><button
                  type="button"
                  class="action_button danger"
                  :disabled="busy"
                  @click="confirm('delete', entry)"
                >
                  {{ t.antivirus.delete }}
                </button>
              </span>
            </li>
          </ul>
        </div>
      </template>

      <AntivirusSettingsModal
        v-if="settingsOpen"
        v-model="settingsOpen"
        :settings="status.settings"
        :busy="busy"
        @save="saveSettings"
        @toggle="toggle"
        @forget="forgetScanned"
      />
    </template>

    <CommonModal
      v-model="confirmationOpen"
      :title="confirmation?.action === 'restore' ? t.antivirus.restore : t.antivirus.delete"
    >
      <p>
        {{ confirmation?.action === 'restore' ? t.antivirus.restoreNote : t.antivirus.deleteNote }}
      </p>
      <p>{{ confirmation?.entry.detection.path }}</p>
      <template #footer>
        <button type="button" class="action_button" @click="confirmationOpen = false">
          {{ t.cancel }}
        </button>
        <button
          type="button"
          class="action_button danger"
          :disabled="busy"
          data-testid="quarantine_confirm"
          @click="confirmed"
        >
          {{ t.confirm }}
        </button>
      </template>
    </CommonModal>
  </section>
</template>

<style scoped lang="scss">

.antivirus_header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.settings_button {
  --app-icon-size: 26px;
  min-width: 44px;
  min-height: 44px;
  flex: none;
  border: 1px solid var(--nas-border);
  border-radius: 12px;
  background: var(--nas-surface);

  &:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--accent) 50%, var(--nas-border));
    color: var(--accent);
  }
}

.antivirus_alert,
.antivirus_operation {
  margin-bottom: 20px;
}

.scan_actions {
  flex-wrap: wrap;
}

.scan_start {
  margin-left: auto;
}

.threat_list {
  @extend %reset_list;
  display: grid;
  gap: 8px;
}

.threat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--nas-error) 30%, var(--nas-border));
  border-radius: 10px;
  background: color-mix(in srgb, var(--nas-error) 5%, var(--nas-sunken));
}

.threat_text {
  display: grid;
  gap: 2px;
  min-width: 0;

  code {
    color: var(--nas-muted);
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  small {
    color: var(--nas-muted);
    font-size: 12px;
  }
}

</style>
