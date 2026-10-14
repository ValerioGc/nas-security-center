<script setup lang="ts">

import { computed, ref } from 'vue';
import { useI18n } from '@/i18n';
import { addDevice } from '@/services/devices';
import type { Device, DeviceCredential, DeviceIcon } from '@/types';
import { failureMessage } from '@/utils/failureMessage';

import CommonModal from '@/components/common/CommonModal.vue';
import CredentialPanel from '@/components/devices/CredentialPanel.vue';
import DeviceIconPicker from '@/components/devices/DeviceIconPicker.vue';

const open = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  added: [device: Device];
}>();

const { t } = useI18n();
const name = ref('');
const icon = ref<DeviceIcon>('desktop');
const password = ref('');
const busy = ref(false);
const error = ref('');
const credential = ref<DeviceCredential | null>(null);

const ready = computed(() => name.value.trim() !== '' && password.value !== '' && !busy.value);

async function submit() {
  if (!ready.value) {
    return;
  }

  busy.value = true;
  error.value = '';
  try {
    const issued = await addDevice({ name: name.value.trim(), icon: icon.value }, password.value);
    credential.value = issued.credential;
    emit('added', issued.device);
  } catch (cause) {
    error.value = failureMessage(cause, t.value);
  } finally {
    password.value = '';
    busy.value = false;
  }
}

</script>

<template>
  <CommonModal v-model="open" :title="credential ? t.deviceReady : t.newDevice">
    <CredentialPanel v-if="credential" :credential="credential" />

    <form v-else id="new_device_form" class="device_form" @submit.prevent="submit">
      <label class="field">
        {{ t.deviceName }}
        <input
          v-model="name"
          type="text"
          maxlength="60"
          autocomplete="off"
          data-testid="device_name"
        />
      </label>

      <DeviceIconPicker v-model="icon" />

      <label class="field">
        {{ t.accountPassword }}
        <input
          v-model="password"
          type="password"
          maxlength="128"
          autocomplete="current-password"
          data-testid="device_password"
        />
      </label>
      <p class="muted">{{ t.newDeviceNote }}</p>

      <p v-if="error" class="alert" role="alert" data-testid="device_add_error">{{ error }}</p>
    </form>

    <template #footer>
      <button
        v-if="credential"
        type="button"
        class="action_button primary"
        data-testid="device_done"
        @click="open = false"
      >
        {{ t.done }}
      </button>
      <template v-else>
        <button type="button" class="action_button" @click="open = false">{{ t.cancel }}</button>
        <button
          type="submit"
          form="new_device_form"
          class="action_button primary"
          :disabled="!ready"
          data-testid="device_add"
        >
          {{ t.add }}
        </button>
      </template>
    </template>
  </CommonModal>
</template>

<style scoped lang="scss">

.device_form {
  display: grid;
  gap: 14px;
}

</style>
