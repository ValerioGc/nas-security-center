<script setup lang="ts">

import { NasIcon } from '@valeriogc/nas-base-app';

defineProps<{
  title: string;
  text?: string;
  svg?: string;
  loading?: boolean;
  testid?: string;
}>();

</script>

<template>
  <div
    class="empty_state"
    :class="{ 'empty_state--loading': loading }"
    :role="loading ? 'status' : undefined"
    :data-testid="testid"
  >
    <span class="empty_symbol" aria-hidden="true">
      <span v-if="loading" class="empty_spinner"></span>
      <NasIcon v-else-if="svg" :svg="svg" />
    </span>
    <strong class="empty_title">{{ title }}</strong>
    <p v-if="text" class="empty_text">{{ text }}</p>

    <!-- Actions slot -->
    <div v-if="$slots.default" class="empty_actions">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">

.empty_state {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 28px 20px;
  border: 1px dashed var(--nas-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--nas-sunken) 55%, transparent);
  text-align: center;
}

.empty_symbol {
  --app-icon-size: 24px;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 4px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
}

.empty_spinner {
  width: 24px;
  height: 24px;
  border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: empty_spin 0.9s linear infinite;
}

.empty_title {
  font-size: 15px;
}

.empty_text {
  max-width: 34rem;
  margin: 0;
  color: var(--nas-muted);
  font-size: 13px;
}

.empty_actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
}

@keyframes empty_spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .empty_spinner {
    animation-duration: 3s;
  }
}

</style>
