<script setup lang="ts">

import { computed } from 'vue';
import { useI18n } from '@/i18n';
import type { ScanKind, ScanOptions } from '@/types';
import { NasNumberStepper, NasSwitch } from '@valeriogc/nas-base-app';

const props = defineProps<{ kind: ScanKind }>();
const options = defineModel<ScanOptions>({ required: true });
const { t } = useI18n();
const maxFileId = computed(() => `antivirus_${props.kind}_max_file`);
const paths = computed({
  get: () => options.value.paths.join('\n'),
  set: (value: string) => {
    options.value.paths = value
      .split('\n')
      .map((path) => path.trim())
      .filter(Boolean);
  },
});
const exclusions = computed({
  get: () => options.value.exclusions.join('\n'),
  set: (value: string) => {
    options.value.exclusions = value
      .split('\n')
      .map((path) => path.trim())
      .filter(Boolean);
  },
});

</script>

<template>
  <div class="page_panel">
    <NasSwitch v-model="options.archives" :label="t.antivirus.archives" />
    <NasSwitch v-model="options.detectPua" :label="t.antivirus.detectPua" />
    <div class="field">
      <label :for="maxFileId">{{ t.antivirus.maxFileMb }}</label>
      <NasNumberStepper
        :id="maxFileId"
        v-model="options.maxFileMb"
        :min="1"
        :max="2048"
        :testid="maxFileId"
        :increase-label="t.increase"
        :decrease-label="t.decrease"
      />
    </div>
    <label v-if="props.kind === 'quick' || props.kind === 'custom'" class="field">
      {{ t.antivirus.defaultPaths }}
      <textarea v-model="paths" rows="3" :placeholder="t.antivirus.pathsHint"></textarea>
    </label>
    <label class="field">
      {{ t.antivirus.exclusions }}
      <textarea v-model="exclusions" rows="3" :placeholder="t.antivirus.pathsHint"></textarea>
    </label>
    <p class="muted">{{ t.antivirus.limitsNote }}</p>
  </div>
</template>
