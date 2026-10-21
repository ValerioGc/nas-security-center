<script setup lang="ts">

import { computed, onMounted, ref } from 'vue';
import { NasSwitch } from '@valeriogc/nas-base-app';
import { useI18n } from '@/i18n';
import { askNasShell } from '@/services/nasShell';
import type { HttpsSettings } from '@/types';
import { failureMessage } from '@/utils/failureMessage';

import CommonModal from '@/components/common/CommonModal.vue';
import PasswordConfirm from '@/components/devices/PasswordConfirm.vue';

const { t } = useI18n();

const saved = ref<HttpsSettings | null>(null);
const port = ref<number | string>(443);
const force = ref(false);
const asking = ref(false);
const busy = ref(false);
const error = ref('');

const valid = computed(
  () =>
    typeof port.value === 'number' &&
    Number.isInteger(port.value) &&
    port.value >= 1 &&
    port.value <= 65535,
);

const changed = computed(
  () => saved.value && (port.value !== saved.value.port || force.value !== saved.value.force),
);

async function load() {
  error.value = '';
  try {
    saved.value = await askNasShell<HttpsSettings>('https-settings');
    port.value = saved.value.port;
    force.value = saved.value.force;
  } catch (cause) {
    error.value = failureMessage(cause, t.value);
  }
}

async function confirm(password: string) {
  if (!valid.value) {
    return;
  }

  busy.value = true;
  error.value = '';
  try {
    saved.value = await askNasShell<HttpsSettings>(
      'save-https-settings',
      { port: port.value, force: force.value, password },
      30000,
    );
    asking.value = false;
  } catch (cause) {
    error.value = failureMessage(cause, t.value);
  } finally {
    busy.value = false;
  }
}

onMounted(load);

</script>

<template>
  <section
    class="surface_card page_panel"
    :aria-label="t.httpsSettingsTitle"
    data-testid="https_settings"
  >
    <h2>{{ t.httpsSettingsTitle }}</h2>
    <p class="muted">{{ t.httpsSettingsNote }}</p>
    <form
      class="https_form"
      @submit.prevent="
        asking = true;
        error = '';
      "
    >
      <label class="field https_port">
        <span>{{ t.httpsPort }}</span>
        <input
          v-model.number="port"
          name="port"
          type="number"
          min="1"
          max="65535"
          step="1"
          required
          :disabled="!saved || busy"
          :aria-invalid="!valid"
          data-testid="https_port"
        />
      </label>
      <NasSwitch
        v-model="force"
        :label="t.forceHttps"
        :disabled="!saved || busy"
        testid="force_https"
      />
      <p class="muted">{{ t.forceHttpsNote }}</p>
      <p v-if="!valid" class="alert" role="alert">{{ t.invalidHttpsPort }}</p>
      <p v-if="error && !asking" class="alert" role="alert">
        {{ error }}
        <button v-if="!saved" type="button" class="action_button" @click="load">
          {{ t.retry }}
        </button>
      </p>
      <div class="app_toolbar save_toolbar">
        <button
          type="submit"
          class="action_button primary"
          :disabled="!valid || !changed || busy"
          data-testid="https_save"
        >
          {{ t.save }}
        </button>
      </div>
    </form>
    <CommonModal v-if="asking" v-model="asking" :title="t.httpsSettingsTitle">
      <PasswordConfirm
        :note="t.httpsSaveNote"
        :action="t.confirm"
        :busy="busy"
        :error="error"
        @confirm="confirm"
        @cancel="asking = false"
      />
    </CommonModal>
  </section>
</template>

<style scoped lang="scss">

h2 {
  margin: 0;
  font-size: 17px;
}

.https_form {
  display: grid;
  gap: 14px;
}

.https_port {
  width: 9rem;
  max-width: 100%;
}

.save_toolbar {
  justify-content: flex-end;
}

</style>
