<script setup lang="ts">

import { useI18n } from '@/i18n';
import type { DeviceIcon } from '@/types';
import { NasIcon } from '@valeriogc/nas-base-app';
import { deviceIcons } from '@/utils/deviceIcons';

const icon = defineModel<DeviceIcon>({ required: true });

const ICONS: DeviceIcon[] = ['desktop', 'laptop', 'phone', 'tv', 'projector'];

const { t } = useI18n();

</script>

<template>
  <fieldset class="icon_picker" :aria-label="t.deviceIcon">
    <legend class="icon_picker_legend">{{ t.deviceIcon }}</legend>
    <button
      v-for="option in ICONS"
      :key="option"
      type="button"
      class="icon_picker_option"
      :aria-pressed="icon === option"
      :data-testid="`device_icon_${option}`"
      @click="icon = option"
    >
      <NasIcon :svg="deviceIcons[option]" />
      <span>{{ t.deviceIcons[option] }}</span>
    </button>
  </fieldset>
</template>

<style scoped lang="scss">

.icon_picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 8px;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.icon_picker_legend {
  grid-column: 1 / -1;
  margin-bottom: 6px;
  padding: 0;
  color: var(--nas-muted);
  font-size: 13px;
}

.icon_picker_option {
  --app-icon-size: 26px;
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 12px 6px 10px;
  border: 1px solid var(--nas-border);
  border-radius: 10px;
  background: var(--nas-sunken);
  color: var(--nas-muted);
  font-size: 12px;

  &:hover {
    color: var(--nas-foreground);
  }

  &[aria-pressed='true'] {
    background: var(--accent-soft);
    color: var(--accent);
  }
}

</style>
