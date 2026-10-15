<script setup lang="ts">

import { computed } from 'vue';

const props = defineProps<{
  label: string;
  phase: string;
  progress: number | null;
  detail?: string;
}>();

const percent = computed(() =>
  props.progress === null ? null : Math.min(100, Math.max(0, Math.round(props.progress))),
);

</script>

<template>
  <div class="operation" aria-live="polite" data-testid="antivirus_progress">
    <div class="operation_head">
      <span v-if="percent === null" class="operation_spinner" aria-hidden="true"></span>
      <span v-else class="operation_dot" aria-hidden="true"></span>
      <output class="operation_phase">{{ phase }}</output>
      <strong v-if="percent !== null" class="operation_percent">{{ percent }}%</strong>
    </div>
    <progress
      v-if="percent !== null"
      class="operation_track"
      :value="percent"
      :max="100"
      :aria-label="label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percent"
    >
      {{ percent }}%
    </progress>
    <p v-if="detail" class="operation_detail">{{ detail }}</p>
  </div>
</template>

<style scoped lang="scss">

.operation {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--nas-border));
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 6%, var(--nas-panel));
}

.operation_head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.operation_dot {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 5px var(--accent-soft);
}

.operation_spinner {
  flex: none;
  width: 18px;
  height: 18px;
  border: 2px solid var(--accent-soft);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: operation_spin 0.9s linear infinite;
}

.operation_phase {
  flex: 1;
  min-width: 0;
  font-weight: 600;
}

.operation_percent {
  color: var(--accent);
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.operation_track {
  appearance: none;
  display: block;
  width: 100%;
  height: 10px;
  border: 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--nas-sunken);
  box-shadow: inset 0 1px 2px #0000002e;

  &::-webkit-progress-bar {
    border-radius: inherit;
    background: var(--nas-sunken);
  }

  &::-webkit-progress-value {
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--accent) 72%, var(--nas-panel)),
      var(--accent)
    );
  }

  &::-moz-progress-bar {
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--accent) 72%, var(--nas-panel)),
      var(--accent)
    );
  }
}

.operation_detail {
  margin: 0;
  color: var(--nas-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

@keyframes operation_spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .operation_spinner {
    animation-duration: 3s;
  }
}

</style>
