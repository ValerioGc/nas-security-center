<script setup lang="ts">

import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import { useDevices } from '@/composables/useDevices';
import { deviceStatus } from '@/utils/deviceStatus';
import { formatMoment } from '@/utils/formatMoment';
import { NasIcon } from '@valeriogc/nas-base-app';
import { deviceIcons } from '@/utils/deviceIcons';
import addIcon from '@/assets/icons/add.svg?url';
import MtlsPanel from '@/components/devices/MtlsPanel.vue';
import DeviceDetailsModal from '@/components/modals/DeviceDetailsModal.vue';
import NewDeviceModal from '@/components/modals/NewDeviceModal.vue';

const { t } = useI18n();
const { devices, mtls, loading, error, load, keep, drop, switchMtls } = useDevices();

const chosenId = ref<number | null>(null);
const adding = ref(false);
const certificateAccess = ref(false);

watch(
  () => mtls.value?.enabled,
  (enabled) => {
    certificateAccess.value = enabled ?? false;
  },
);

const chosen = computed(() => devices.value.find((device) => device.id === chosenId.value) ?? null);

const detailsOpen = computed({
  get: () => chosen.value !== null,
  set: (value: boolean) => {
    if (!value) {
      chosenId.value = null;
    }
  },
});

function seen(at: number | null | undefined) {
  return at ? `${t.value.lastSeen} ${formatMoment(at)}` : t.value.neverSeen;
}

onMounted(load);

</script>

<template>
  <section :aria-label="t.sections.devices">
    <header class="page_header devices_header">
      <div>
        <h1>{{ t.sections.devices }}</h1>
        <p>{{ t.devicesIntro }}</p>
      </div>
      <button
        type="button"
        class="action_button primary"
        :disabled="!mtls?.available || !certificateAccess"
        data-testid="device_new"
        @click="adding = true"
      >
        <NasIcon :svg="addIcon" />
        {{ t.addDevice }}
      </button>
    </header>

    <p v-if="error" class="alert" role="alert" data-testid="devices_error">
      <span class="alert_message">{{ error }}</span>
      <button type="button" class="action_button" @click="load">{{ t.retry }}</button>
    </p>

    <output v-if="loading && !mtls" class="muted">{{ t.loading }}</output>

    <MtlsPanel v-if="mtls" v-model="certificateAccess" :state="mtls" :save="switchMtls" />

    <p
      v-if="mtls && !devices.length"
      class="surface_card devices_empty"
      data-testid="devices_empty"
    >
      {{ t.noDevices }}
    </p>

    <ul class="device_list">
      <li v-for="device in devices" :key="device.id">
        <button
          type="button"
          class="device_card surface_card"
          :data-testid="`device_${device.id}`"
          @click="chosenId = device.id"
        >
          <span class="device_icon"><NasIcon :svg="deviceIcons[device.icon]" /></span>
          <span class="device_text">
            <strong>{{ device.name }}</strong>
            <small>{{ seen(device.certificate?.seenAt) }}</small>
          </span>
          <span class="device_badges">
            <span v-if="device.current" class="device_current">{{ t.currentDevice }}</span>
            <span v-if="device.sync" class="device_current">{{ t.syncClient }}</span>
            <span :class="['device_state', deviceStatus(device)]">
              {{ t.deviceStates[deviceStatus(device)] }}
            </span>
          </span>
        </button>
      </li>
    </ul>

    <DeviceDetailsModal
      v-if="chosen"
      :key="chosen.id"
      v-model="detailsOpen"
      :device="chosen"
      :mtls-enabled="mtls?.enabled ?? false"
      @changed="keep"
      @removed="drop"
    />
    <NewDeviceModal v-if="adding" v-model="adding" @added="keep" />
  </section>
</template>

<style scoped lang="scss">

.devices_header {
  @extend %fx_between;
  gap: 16px;
}

.devices_empty {
  padding: 24px;
  color: var(--nas-muted);
  text-align: center;
}

.device_list {
  @extend %reset_list;
  display: grid;
  gap: 10px;
}

.device_card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 20px;
  color: inherit;
  text-align: left;

  &:hover {
    background: var(--nas-hover);
  }
}

.device_icon {
  --app-icon-size: 22px;
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
}

.device_text {
  display: grid;
  min-width: 0;

  strong {
    @extend %text_ellipsis;
  }

  small {
    color: var(--nas-muted);
  }
}

.device_badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

</style>
