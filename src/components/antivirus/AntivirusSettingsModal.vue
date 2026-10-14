<script setup lang="ts">

import { computed, ref, watch, toRaw } from 'vue';
import { useI18n } from '@/i18n';
import type { AntivirusSettings, ScanKind } from '@/types';

import { NasSwitch, randomUuid } from '@valeriogc/nas-base-app';
import { usePowerSchedule } from '@/composables/usePowerSchedule';
import CommonModal from '@/components/common/CommonModal.vue';
import ScanOptionsForm from '@/components/antivirus/ScanOptionsForm.vue';

const { t } = useI18n();

const props = defineProps<{ settings: AntivirusSettings; busy: boolean }>();
const emit = defineEmits<{
  save: [settings: AntivirusSettings];
  toggle: [enabled: boolean];
  forget: [];
}>();

const open = defineModel<boolean>({ required: true });

const draft = ref<AntivirusSettings>(structuredClone(toRaw(props.settings)));

const tabs = computed(() =>
  props.settings.enabled
    ? (['general', 'scheduler', 'scans', 'quarantine'] as const)
    : (['general'] as const),
);

type Tab = 'general' | 'scheduler' | 'scans' | 'quarantine';
const tab = ref<Tab>(props.settings.enabled ? 'scheduler' : 'general');
const confirmingDisable = ref(false);
const power = usePowerSchedule();
const invalidSchedules = computed(
  () =>
    draft.value.schedulerEnabled &&
    draft.value.schedules.some((job) => power.conflict(job) === 'off'),
);

const lifecycleScans = ['bootScan', 'shutdownScan'] as const;
const kinds: ScanKind[] = ['quick', 'full', 'file', 'custom'];
const days = [
  { id: '*', key: 'everyday' },
  { id: 'Mon', key: 'monday' },
  { id: 'Tue', key: 'tuesday' },
  { id: 'Wed', key: 'wednesday' },
  { id: 'Thu', key: 'thursday' },
  { id: 'Fri', key: 'friday' },
  { id: 'Sat', key: 'saturday' },
  { id: 'Sun', key: 'sunday' },
] as const;

watch(open, (value) => {
  if (value) {
    draft.value = structuredClone(toRaw(props.settings));
    void power.load();
  }
});

if (open.value) {
  void power.load();
}

function submit() {
  if (!invalidSchedules.value) {
    emit('save', draft.value);
  }
}

function addJob() {
  draft.value.schedules.push({
    id: randomUuid(),
    enabled: true,
    kind: 'quick',
    day: '*',
    time: '03:00',
    paths: [],
  });
}

function keyboard(event: KeyboardEvent) {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
    return;
  }

  event.preventDefault();
  const list: readonly Tab[] = tabs.value;
  const index = list.indexOf(tab.value);

  let nextIndex: number;
  if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = list.length - 1;
  } else {
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    nextIndex = (index + direction + list.length) % list.length;
  }

  tab.value = list[nextIndex] ?? 'general';
  const target = event.currentTarget as HTMLElement;
  target.querySelector<HTMLButtonElement>(`[data-tab="${tab.value}"]`)?.focus();
}

</script>

<template>
  <CommonModal v-model="open" :title="t.antivirus.settings">
    <form id="antivirus_settings_form" @submit.prevent="submit">
      <div
        class="app_toolbar"
        role="tablist"
        :aria-label="t.antivirus.settings"
        @keydown="keyboard"
      >
        <button
          v-for="item in tabs"
          :id="`antivirus_tab_${item}`"
          :key="item"
          type="button"
          class="action_button"
          role="tab"
          :aria-selected="tab === item"
          :tabindex="tab === item ? 0 : -1"
          :aria-controls="`antivirus_panel_${item}`"
          :data-tab="item"
          @click="tab = item"
        >
          {{ t.antivirus.tabs[item] }}
        </button>
      </div>

      <div :id="`antivirus_panel_${tab}`" role="tabpanel" :aria-labelledby="`antivirus_tab_${tab}`">
        <div v-if="tab === 'general'" class="page_panel" data-testid="antivirus_general">
          <div class="general_state" :class="{ 'general_state--on': settings.enabled }">
            <strong>{{ settings.enabled ? t.antivirus.enabled : t.antivirus.disabled }}</strong>
            <p class="muted">
              {{ settings.enabled ? t.antivirus.enabledNote : t.antivirus.disabledNote }}
            </p>
          </div>

          <button
            v-if="!settings.enabled"
            type="button"
            class="action_button primary"
            :disabled="busy"
            data-testid="antivirus_enable"
            @click="emit('toggle', true)"
          >
            {{ t.antivirus.enable }}
          </button>

          <template v-else-if="!confirmingDisable">
            <button
              type="button"
              class="action_button danger"
              :disabled="busy"
              data-testid="antivirus_disable"
              @click="confirmingDisable = true"
            >
              {{ t.antivirus.disable }}
            </button>
          </template>

          <div v-else class="alert general_confirm" role="alert">
            <span class="alert_message">{{ t.antivirus.disableConfirm }}</span>
            <button type="button" class="action_button" @click="confirmingDisable = false">
              {{ t.cancel }}
            </button>
            <button
              type="button"
              class="action_button danger"
              :disabled="busy"
              data-testid="antivirus_disable_confirm"
              @click="emit('toggle', false)"
            >
              {{ t.antivirus.confirmDisable }}
            </button>
          </div>
        </div>

        <div v-else-if="tab === 'scheduler'" class="page_panel">
          <NasSwitch
            v-model="draft.schedulerEnabled"
            :label="t.antivirus.schedulerEnabled"
            testid="antivirus_scheduler"
          />

          <p class="muted">{{ t.antivirus.scheduleNote }}</p>

          <p v-if="power.state.value === 'loading'">
            <output>{{ t.antivirus.powerLoading }}</output>
          </p>

          <p v-else-if="power.state.value === 'unavailable'" role="alert">
            {{ t.antivirus.powerUnavailable }}
          </p>

          <fieldset v-for="phase in lifecycleScans" :key="phase" class="page_panel surface_card">
            <NasSwitch
              v-model="draft[phase].enabled"
              :label="t.antivirus[phase]"
              :testid="`antivirus_${phase}`"
            />

            <label v-if="draft[phase].enabled" class="field">
              {{ t.antivirus.scanType }}
              <select v-model="draft[phase].kind" :data-testid="`antivirus_${phase}_kind`">
                <option v-for="kind in kinds" :key="kind" :value="kind">
                  {{ t.antivirus.kinds[kind] }}
                </option>
              </select>
            </label>

            <label
              v-if="draft[phase].enabled && ['file', 'custom'].includes(draft[phase].kind)"
              class="field"
            >
              {{ t.antivirus.paths }}
              <textarea
                :value="draft[phase].paths.join('\n')"
                required
                rows="2"
                @input="
                  draft[phase].paths = ($event.target as HTMLTextAreaElement).value
                    .split('\n')
                    .map((path) => path.trim())
                    .filter(Boolean)
                "
              ></textarea>
            </label>
          </fieldset>

          <p class="muted">{{ t.antivirus.lifecycleNote }}</p>

          <fieldset
            v-for="(job, index) in draft.schedules"
            :key="job.id"
            class="page_panel surface_card"
          >
            <legend>{{ t.antivirus.job }} {{ index + 1 }}</legend>
            <NasSwitch v-model="job.enabled" :label="t.antivirus.jobEnabled" />
            <label class="field">
              {{ t.antivirus.scanType }}
              <select v-model="job.kind">
                <option v-for="kind in kinds" :key="kind" :value="kind">
                  {{ t.antivirus.kinds[kind] }}
                </option>
              </select>
            </label>
            <label class="field"
              >{{ t.antivirus.day
              }}<select v-model="job.day">
                <option v-for="day in days" :key="day.id" :value="day.id">
                  {{ t.antivirus.days[day.key] }}
                </option>
              </select></label
            >
            <label class="field"
              >{{ t.antivirus.time }}<input v-model="job.time" type="time" required />
            </label>
            <label v-if="job.kind === 'file' || job.kind === 'custom'" class="field">
              {{ t.antivirus.paths }}
              <textarea
                :value="job.paths.join('\n')"
                required
                rows="2"
                :placeholder="t.antivirus.pathsHint"
                @input="
                  job.paths = ($event.target as HTMLTextAreaElement).value
                    .split('\n')
                    .map((path) => path.trim())
                    .filter(Boolean)
                "
              ></textarea>
            </label>

            <p v-if="draft.schedulerEnabled && power.conflict(job)" role="alert">
              {{ power.conflict(job) === 'off' ? t.antivirus.powerOff : t.antivirus.powerSoon }}
            </p>

            <button
              type="button"
              class="action_button danger"
              @click="draft.schedules.splice(index, 1)"
            >
              {{ t.remove }}
            </button>
          </fieldset>

          <button
            type="button"
            class="action_button"
            :disabled="draft.schedules.length >= 20"
            @click="addJob"
          >
            {{ t.antivirus.addJob }}
          </button>
        </div>
        <div v-else-if="tab === 'quarantine'" class="page_panel">
          <NasSwitch v-model="draft.autoQuarantine" :label="t.antivirus.autoQuarantine" />
          <p class="muted">{{ t.antivirus.quarantineNote }}</p>
        </div>
        <div v-else class="page_panel scan_cards" :aria-label="t.antivirus.scanCards">
          <section
            v-for="kind in kinds"
            :key="kind"
            class="surface_card scan_card"
            :data-testid="`antivirus_options_${kind}`"
          >
            <header>
              <h3>{{ t.antivirus.kinds[kind] }}</h3>
              <p class="muted">{{ t.antivirus.scope[kind] }}</p>
            </header>
            <ScanOptionsForm v-model="draft[kind]" :kind="kind" />
          </section>
          <section class="surface_card scan_card" data-testid="antivirus_scanned_archive">
            <header>
              <h3>{{ t.antivirus.scannedArchive }}</h3>
              <p class="muted">{{ t.antivirus.scannedArchiveNote }}</p>
            </header>
            <button
              type="button"
              class="action_button"
              :disabled="busy"
              data-testid="antivirus_forget"
              @click="emit('forget')"
            >
              {{ t.antivirus.forgetScanned }}
            </button>
          </section>
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="action_button" @click="open = false">{{ t.cancel }}</button>
      <button
        v-if="settings.enabled"
        type="submit"
        form="antivirus_settings_form"
        class="action_button primary"
        :disabled="busy || invalidSchedules"
      >
        {{ t.save }}
      </button>
    </template>
  </CommonModal>
</template>

<style scoped lang="scss">

.general_state {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-left: 3px solid var(--nas-border);
  border-radius: 8px;
  background: var(--nas-sunken);

  &--on {
    border-left-color: var(--accent);
  }
}

.page_panel > .action_button {
  justify-self: start;
}

.general_confirm {
  color: var(--nas-foreground);
}

.scan_cards {
  gap: 14px;
}

.scan_card {
  display: grid;
  gap: 4px;
  padding: 16px 18px;

  header {
    display: grid;
    gap: 4px;
  }

  h3 {
    margin: 0;
    font-size: 15px;
  }

  :deep(.page_panel) {
    margin-bottom: 0;
    padding: 12px 0 0;
  }
}

</style>
