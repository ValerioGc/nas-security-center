<script setup lang="ts">

import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import type { MtlsState } from '@/types';
import { failureMessage } from '@/utils/failureMessage';
import { NasSwitch } from '@valeriogc/nas-base-app';
import CommonModal from '@/components/common/CommonModal.vue';
import PasswordConfirm from '@/components/devices/PasswordConfirm.vue';

interface Props {
  state: MtlsState;
  save: (enabled: boolean, password: string) => Promise<void>;
}

const props = defineProps<Props>();

const { t } = useI18n();
const shown = defineModel<boolean>({ default: false });
const asking = ref(false);
const busy = ref(false);
const error = ref('');

const title = computed(() => (shown.value ? t.value.mtlsOnTitle : t.value.mtlsOffTitle));

watch(
  () => props.state.enabled,
  (enabled) => (shown.value = enabled),
);

watch(asking, (open) => {
  if (!open) {
    shown.value = props.state.enabled;
    error.value = '';
  }
});

function ask(enabled: boolean) {
  if (enabled && !props.state.current) {
    return;
  }

  asking.value = enabled !== props.state.enabled;
}

async function confirm(password: string) {
  busy.value = true;
  error.value = '';
  try {
    await props.save(shown.value, password);
    asking.value = false;
  } catch (cause) {
    error.value = failureMessage(cause, t.value);
  } finally {
    busy.value = false;
  }
}

</script>

<template>
  <section class="surface_card page_panel" :aria-label="t.mtlsTitle" data-testid="mtls_panel">
    <NasSwitch
      v-model="shown"
      :label="t.mtlsTitle"
      :disabled="!state.available"
      testid="mtls_enabled"
      @update:model-value="ask"
    />
    <p class="muted">{{ state.available ? t.mtlsNote : t.mtlsUnavailable }}</p>
    <p v-if="shown && !state.enabled && !state.current" class="muted" data-testid="mtls_setup">
      {{ t.mtlsSetup }}
    </p>

    <CommonModal v-if="asking" v-model="asking" :title="title">
      <PasswordConfirm
        :note="shown ? t.mtlsOnNote : t.mtlsOffNote"
        :action="t.confirm"
        :busy="busy"
        :error="error"
        @confirm="confirm"
        @cancel="asking = false"
      />
    </CommonModal>
  </section>
</template>
