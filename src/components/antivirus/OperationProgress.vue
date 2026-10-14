<script setup lang="ts">

import { computed } from 'vue';

/**
 * Where an operation of the antivirus is: what it is doing, and how far, when it knows. Without a
 * percentage a stripe runs along the track instead of a convincing zero.
 */
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
      <span class="operation_pulse" aria-hidden="true"></span>
      <output class="operation_phase">{{ phase }}</output>
      <strong v-if="percent !== null" class="operation_percent">{{ percent }}%</strong>
    </div>
    <div
      class="operation_track"
      :class="{ 'operation_track--unknown': percent === null }"
      role="progressbar"
      :aria-label="label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percent ?? undefined"
    >
      <span class="operation_fill" :style="percent === null ? undefined : { width: `${percent}%` }">
      </span>
    </div>
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

.operation_pulse {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent);
  animation: operation_pulse 1.6s ease-out infinite;
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
  position: relative;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--nas-sunken);
  box-shadow: inset 0 1px 2px #0000002e;
}

.operation_fill {
  display: block;
  height: 100%;
  min-width: 12px;
  border-radius: inherit;
  background:
    repeating-linear-gradient(-45deg, #ffffff26 0 8px, transparent 8px 16px),
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 70%, var(--nas-panel)), var(--accent));
  background-size:
    22px 22px,
    100% 100%;
  transition: width 0.4s ease;
  animation: operation_stripes 0.8s linear infinite;

  .operation_track--unknown & {
    position: absolute;
    width: 35%;
    animation:
      operation_stripes 0.8s linear infinite,
      operation_slide 1.4s ease-in-out infinite;
  }
}

.operation_detail {
  margin: 0;
  color: var(--nas-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

@keyframes operation_stripes {
  to {
    background-position:
      22px 0,
      0 0;
  }
}

@keyframes operation_slide {
  from {
    left: -35%;
  }

  to {
    left: 100%;
  }
}

@keyframes operation_pulse {
  70% {
    box-shadow: 0 0 0 8px transparent;
  }

  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .operation_fill,
  .operation_pulse {
    animation: none;
  }

  .operation_track--unknown .operation_fill {
    left: 0;
    width: 100%;
    opacity: 0.5;
  }
}

</style>
