<script setup lang="ts">

import { computed, ref } from 'vue';
import { useI18n } from '@/i18n';
import { removeDevice, renewDevice, revokeDevice, updateDevice } from '@/services/devices';
import type { Device, DeviceCredential, DeviceIcon } from '@/types';
import { deviceStatus, formatFingerprint } from '@/utils/deviceStatus';
import { failureMessage } from '@/utils/failureMessage';
import { formatMoment } from '@/utils/formatMoment';
import { NasIcon } from '@valeriogc/nas-base-app';

import deleteIcon from '@/assets/icons/delete.svg?url';
import refreshIcon from '@/assets/icons/refresh.svg?url';
import revokeIcon from '@/assets/icons/revoke.svg?url';

import CommonModal from '@/components/common/CommonModal.vue';
import CredentialPanel from '@/components/devices/CredentialPanel.vue';
import DeviceIconPicker from '@/components/devices/DeviceIconPicker.vue';
import PasswordConfirm from '@/components/devices/PasswordConfirm.vue';

interface Props {
  device: Device;
  mtlsEnabled: boolean;
}

const props = defineProps<Props>();

const open = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  changed: [device: Device];
  removed: [id: number];
}>();

type Stage = 'view' | 'renew' | 'revoke' | 'remove';

const { t } = useI18n();
const stage = ref<Stage>('view');
const name = ref(props.device.name);
const icon = ref<DeviceIcon>(props.device.icon);
const busy = ref(false);
const error = ref('');

const credential = ref<DeviceCredential | null>(null);

const status = computed(() => deviceStatus(props.device));
const certificate = computed(() => props.device.certificate);
const edited = computed(
  () =>
    name.value.trim() !== '' &&
    (name.value.trim() !== props.device.name || icon.value !== props.device.icon),
);

const locked = computed(() => props.device.current && props.mtlsEnabled);
const title = computed(() => {
  if (credential.value) {
    return t.value.certificateRenewed;
  }
  const titles: Record<Stage, string> = {
    view: t.value.deviceDetails,
    renew: t.value.renewCertificate,
    revoke: t.value.revokeCertificate,
    remove: t.value.removeDevice,
  };
  
  return titles[stage.value];
});

function moment(at: number | null | undefined) {
  return at ? formatMoment(at) : t.value.never;
}

/** Runs an action and returns to the device view, or shows the error. */
async function act(run: () => Promise<void>) {
  busy.value = true;
  error.value = '';
  try {
    await run();
    stage.value = 'view';
  } catch (cause) {
    error.value = failureMessage(cause, t.value);
  } finally {
    busy.value = false;
  }
}

function go(next: Stage) {
  error.value = '';
  stage.value = next;
}

const save = () =>
  act(async () => {
    emit(
      'changed',
      await updateDevice(props.device.id, { name: name.value.trim(), icon: icon.value }),
    );
  });

const renew = (password: string) =>
  act(async () => {
    const issued = await renewDevice(props.device.id, password);
    credential.value = issued.credential;
    emit('changed', issued.device);
  });

const revoke = () =>
  act(async () => {
    emit('changed', await revokeDevice(props.device.id));
  });

const remove = () =>
  act(async () => {
    await removeDevice(props.device.id);
    emit('removed', props.device.id);
    open.value = false;
  });

</script>

<template>
  <CommonModal v-model="open" :title="title">
    <div v-if="credential" class="details_stage">
      <p class="muted">{{ t.renewedNote }}</p>
      <CredentialPanel :credential="credential" />
      <div class="app_toolbar details_actions">
        <button
          type="button"
          class="action_button primary"
          data-testid="device_renew_done"
          @click="credential = null"
        >
          {{ t.done }}
        </button>
      </div>
    </div>

    <PasswordConfirm
      v-else-if="stage === 'renew'"
      :note="t.renewNote"
      :action="t.renewCertificate"
      :busy="busy"
      :error="error"
      @confirm="renew"
      @cancel="go('view')"
    />

    <div v-else-if="stage === 'revoke' || stage === 'remove'" class="details_stage">
      <p>{{ stage === 'revoke' ? t.revokeNote : t.removeNote }}</p>
      <p v-if="error" class="alert" role="alert" data-testid="device_action_error">{{ error }}</p>
      <div class="app_toolbar details_actions">
        <button type="button" class="action_button" @click="go('view')">{{ t.cancel }}</button>
        <button
          type="button"
          class="action_button danger"
          :disabled="busy"
          data-testid="device_action_confirm"
          @click="stage === 'revoke' ? revoke() : remove()"
        >
          {{ stage === 'revoke' ? t.revoke : t.remove }}
        </button>
      </div>
    </div>

    <div v-else class="details_stage" data-testid="device_details">
      <form class="details_form" @submit.prevent="save">
        <label class="field">
          {{ t.deviceName }}
          <input
            v-model="name"
            name="name"
            type="text"
            maxlength="60"
            autocomplete="off"
            data-testid="device_edit_name"
          />
        </label>
        <DeviceIconPicker v-model="icon" />
        <button
          v-if="edited"
          type="submit"
          class="action_button primary"
          :disabled="busy"
          data-testid="device_save"
        >
          {{ t.save }}
        </button>
      </form>

      <section class="details_certificate" :aria-label="t.certificate">
        <h3>{{ t.certificate }}</h3>
        <dl class="details_fields" data-testid="device_certificate">
          <dt>{{ t.certificateState }}</dt>
          <dd>
            <span :class="['device_state', status]">{{ t.deviceStates[status] }}</span>
            <span v-if="device.current" class="device_current">{{ t.currentDevice }}</span>
            <span v-if="device.sync" class="device_current">{{ t.syncClient }}</span>
          </dd>
          <template v-if="certificate">
            <dt>{{ t.fingerprint }}</dt>
            <dd class="fingerprint">
              <!-- Wraps only between byte pairs. -->
              <span
                v-for="(pair, index) in formatFingerprint(certificate.fingerprint).split(':')"
                :key="index"
                >{{ index ? ':' : '' }}<wbr v-if="index" />{{ pair }}</span
              >
            </dd>
            <dt>{{ t.issuedOn }}</dt>
            <dd>{{ moment(certificate.issuedAt) }}</dd>
            <dt>{{ t.expiresOn }}</dt>
            <dd>{{ moment(certificate.expiresAt) }}</dd>
            <dt>{{ t.activatedOn }}</dt>
            <dd>{{ moment(certificate.activatedAt) }}</dd>
            <dt>{{ t.lastSeen }}</dt>
            <dd>{{ moment(certificate.seenAt) }}</dd>
          </template>
          <dt>{{ t.createdOn }}</dt>
          <dd>{{ moment(device.createdAt) }}</dd>
        </dl>

        <div class="app_toolbar">
          <button
            v-if="!device.sync"
            type="button"
            class="action_button"
            :disabled="locked || busy"
            :title="locked ? t.ownDeviceLocked : undefined"
            data-testid="device_renew"
            @click="go('renew')"
          >
            <NasIcon :svg="refreshIcon" />
            {{ t.renewCertificate }}
          </button>
          <button
            type="button"
            class="action_button"
            :disabled="locked || busy || !certificate || certificate.state === 'revoked'"
            :title="locked ? t.ownDeviceLocked : undefined"
            data-testid="device_revoke"
            @click="go('revoke')"
          >
            <NasIcon :svg="revokeIcon" />
            {{ t.revokeCertificate }}
          </button>
        </div>
      </section>

      <p v-if="locked" class="muted" data-testid="device_locked">{{ t.ownDeviceLocked }}</p>
      <p v-if="error" class="alert" role="alert" data-testid="device_action_error">{{ error }}</p>

      <div class="app_toolbar details_actions">
        <button
          type="button"
          class="action_button danger"
          :disabled="locked || busy"
          :title="locked ? t.ownDeviceLocked : undefined"
          data-testid="device_remove"
          @click="go('remove')"
        >
          <NasIcon :svg="deleteIcon" />
          {{ t.removeDevice }}
        </button>
      </div>
    </div>
  </CommonModal>
</template>

<style scoped lang="scss">

.details_stage,
.details_form {
  display: grid;
  gap: 16px;
}

.details_form {
  justify-items: stretch;

  > button {
    justify-self: start;
  }
}

.details_actions {
  justify-content: flex-end;
}

.details_certificate {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 10px;
  background: var(--nas-sunken);

  h3 {
    margin: 0;
    font-size: 15px;
  }
}

.details_fields {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px 20px;
  margin: 0;
  font-size: 13px;

  dt {
    color: var(--nas-muted);
  }

  dd {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
  }
}

.details_fields dd.fingerprint {
  display: block;
  font-family: ui-monospace, monospace;
  font-size: 12px;
}

</style>
