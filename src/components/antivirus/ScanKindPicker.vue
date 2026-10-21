<script setup lang="ts">

import { useId } from 'vue';
import { useI18n } from '@/i18n';
import type { ScanKind } from '@/types';

defineProps<{ disabled?: boolean }>();
const kind = defineModel<ScanKind>({ required: true });
const { t } = useI18n();
const group = useId();
const kinds: ScanKind[] = ['quick', 'full', 'file', 'custom'];

</script>

<template>
  <fieldset class="scan_kinds" :disabled="disabled">
    <legend class="sr_only">{{ t.antivirus.scanType }}</legend>
    <label
      v-for="item in kinds"
      :key="item"
      class="scan_kind"
      :class="{ 'scan_kind--chosen': kind === item }"
      :data-testid="`antivirus_kind_${item}`"
    >
      <input v-model="kind" type="radio" :name="group" :value="item" class="sr_only" />
      <span class="scan_kind_mark" aria-hidden="true"></span>
      <span class="scan_kind_text">
        <strong>{{ t.antivirus.kinds[item] }}</strong>
        <small>{{ t.antivirus.scope[item] }}</small>
      </span>
    </label>
  </fieldset>
</template>

<style scoped lang="scss">

.scan_kinds {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;

  &:disabled .scan_kind {
    opacity: 0.6;
    cursor: default;
  }
}

.scan_kind {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--nas-border);
  border-radius: 12px;
  background: var(--nas-sunken);
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 50%, var(--nas-border));
  }

  &:focus-within {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 45%, transparent);
  }

  &--chosen {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
}

.scan_kind_mark {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border: 2px solid var(--nas-border);
  border-radius: 50%;
  transition: border 0.16s ease;

  .scan_kind--chosen & {
    border: 5px solid var(--accent);
  }
}

@media (max-width: 640px) {
  .scan_kinds {
    grid-template-columns: minmax(0, 1fr);
  }
}

.scan_kind_text {
  display: grid;
  gap: 4px;

  strong {
    font-size: 15px;
  }

  small {
    color: var(--nas-muted);
    font-size: 12px;
    line-height: 1.45;
  }
}

</style>
