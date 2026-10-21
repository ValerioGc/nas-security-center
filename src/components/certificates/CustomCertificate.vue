<script setup lang="ts">

import { computed, ref } from 'vue';
import { useI18n } from '@/i18n';
import { NasIcon } from '@valeriogc/nas-base-app';
import addIcon from '@/assets/icons/add.svg?url';

const emit = defineEmits<{
  upload: [certificate: string, key: string];
}>();

const LIMIT = 60 * 1024;

const { t } = useI18n();
const certificate = ref<File | null>(null);
const key = ref<File | null>(null);

const ready = computed(
  () =>
    certificate.value !== null &&
    key.value !== null &&
    certificate.value.size <= LIMIT &&
    key.value.size <= LIMIT,
);

function chosen(event: Event) {
  return (event.target as HTMLInputElement).files?.[0] ?? null;
}

async function upload() {
  if (certificate.value && key.value) {
    emit('upload', await certificate.value.text(), await key.value.text());
  }
}

</script>

<template>
  <section
    class="surface_card page_panel"
    :aria-label="t.customTitle"
    data-testid="custom_certificate"
  >
    <h2>{{ t.customTitle }}</h2>
    <p class="muted">{{ t.customNote }}</p>
    <div class="custom_files">
      <label class="field">
        {{ t.certificateFile }}
        <input
          name="custom_certificate"
          type="file"
          accept=".crt,.pem,.cer"
          data-testid="custom_certificate_file"
          @change="certificate = chosen($event)"
        />
      </label>
      <label class="field">
        {{ t.keyFile }}
        <input
          name="custom_key"
          type="file"
          accept=".key,.pem"
          data-testid="custom_key_file"
          @change="key = chosen($event)"
        />
      </label>
    </div>

    <div class="app_toolbar">
      <button
        type="button"
        class="action_button primary"
        :disabled="!ready"
        data-testid="custom_upload"
        @click="upload"
      >
        <NasIcon :svg="addIcon" />
        {{ t.uploadCertificate }}
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">

h2 {
  margin: 0;
  font-size: 17px;
}

.custom_files {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 12px;

  .field {
    min-width: 0;
  }

  input[type='file'] {
    width: 100%;
    min-width: 0;
    padding: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;

    &::file-selector-button {
      margin-right: 12px;
      padding: 8px 12px;
      border: 1px solid var(--nas-border);
      border-radius: 6px;
      background: var(--accent-soft);
      color: var(--nas-foreground);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition:
        background-color 0.16s ease,
        border-color 0.16s ease;
    }

    &:hover::file-selector-button {
      border-color: var(--accent);
      background: var(--nas-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }
}

</style>
