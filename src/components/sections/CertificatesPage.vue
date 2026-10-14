<script setup lang="ts">

import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import { useCertificate } from '@/composables/useCertificate';
import {
  removeCustomCertificate,
  renewCertificate,
  saveCertificateNames,
  uploadCertificate,
} from '@/services/certificates';
import type { ServerCertificate } from '@/types';
import { failureMessage } from '@/utils/failureMessage';
import { shell } from '@/services/nasShell';
import { NasIcon } from '@valeriogc/nas-base-app';
import CommonModal from '@/components/common/CommonModal.vue';
import PasswordConfirm from '@/components/devices/PasswordConfirm.vue';
import ActiveCertificate from '@/components/certificates/ActiveCertificate.vue';
import AuthorityPanel from '@/components/certificates/AuthorityPanel.vue';
import CertificateNames from '@/components/certificates/CertificateNames.vue';
import CustomCertificate from '@/components/certificates/CustomCertificate.vue';
import accessIcon from '@/assets/icons/access.svg?url';
import errorIcon from '@/assets/icons/error.svg?url';
import infoIcon from '@/assets/icons/info.svg?url';
import successIcon from '@/assets/icons/success.svg?url';
import warningIcon from '@/assets/icons/warning.svg?url';

interface Pending {
  title: string;
  note: string;
  run: (password: string) => Promise<ServerCertificate>;
}

const { t } = useI18n();
const { state, loading, error, host, https, covered, load, apply } = useCertificate();

const pending = ref<Pending | null>(null);
const busy = ref(false);
const failure = ref('');

const open = computed({
  get: () => pending.value !== null,
  set: (value: boolean) => {
    if (!value) {
      pending.value = null;
      failure.value = '';
    }
  },
});

function ask(title: string, note: string, run: Pending['run']) {
  failure.value = '';
  pending.value = { title, note, run };
}

async function confirm(password: string) {
  const change = pending.value;
  if (!change) {
    return;
  }

  busy.value = true;
  failure.value = '';
  try {
    await apply(() => change.run(password));
    pending.value = null;
  } catch (cause) {
    failure.value = failureMessage(cause, t.value);
  } finally {
    busy.value = false;
  }
}

function renew() {
  ask(t.value.renewServerCertificate, t.value.renewServerNote, renewCertificate);
}

function restore() {
  ask(t.value.useNasCertificate, t.value.useNasNote, removeCustomCertificate);
}

function saveNames(names: string[]) {
  ask(t.value.saveNames, t.value.saveNamesNote, (password) =>
    saveCertificateNames(names, password),
  );
}

function upload(certificate: string, key: string) {
  ask(t.value.uploadCertificate, t.value.uploadNote, (password) =>
    uploadCertificate(certificate, key, password),
  );
}

onMounted(load);

</script>

<template>
  <section class="certificates" :aria-label="t.sections.certificates">
    <header class="page_header">
      <h1>{{ t.sections.certificates }}</h1>
      <p>{{ t.certificatesIntro }}</p>
    </header>

    <p v-if="error" class="alert" role="alert" data-testid="certificates_error">
      <NasIcon :svg="errorIcon" />
      <span class="alert_message">{{ error }}</span>
      <button type="button" class="action_button" @click="load">{{ t.retry }}</button>
    </p>
    <output v-if="loading && !state" class="muted">{{ t.loading }}</output>

    <template v-if="state">
      <p v-if="!state.served" class="alert alert_info" data-testid="certificate_https_off">
        <NasIcon :svg="infoIcon" />
        <span class="alert_message">{{ t.httpsOff }}</span>
      </p>
      <p
        v-else-if="!https"
        class="alert alert_warning"
        role="alert"
        data-testid="certificate_plain"
      >
        <NasIcon :svg="warningIcon" />
        <span class="alert_message">{{ t.plainConnection }}</span>
        <button
          type="button"
          class="action_button primary"
          data-testid="certificate_open_https"
          @click="shell.openHttps()"
        >
          <NasIcon :svg="accessIcon" />
          {{ t.openHttps }}
        </button>
      </p>
      <p
        v-else-if="!covered"
        class="alert alert_warning"
        role="alert"
        data-testid="certificate_not_covered"
      >
        <NasIcon :svg="warningIcon" />
        <span class="alert_message">{{ t.hostNotCovered.replace('{host}', host) }}</span>
      </p>
      <p v-else class="alert alert_success" data-testid="certificate_covered">
        <NasIcon :svg="successIcon" />
        <span class="alert_message">{{ t.hostCovered.replace('{host}', host) }}</span>
      </p>

      <ActiveCertificate
        v-if="state.active"
        :certificate="state.active"
        :custom="state.custom"
        @renew="renew"
        @restore="restore"
      />
      <CertificateNames
        :automatic="state.automaticNames"
        :extra="state.extraNames"
        :custom="state.custom"
        @save="saveNames"
      />
      <CustomCertificate @upload="upload" />
      <AuthorityPanel :authority="state.authority" />
    </template>

    <CommonModal v-if="pending" v-model="open" :title="pending.title">
      <PasswordConfirm
        :note="pending.note"
        :action="t.confirm"
        :busy="busy"
        :error="failure"
        @confirm="confirm"
        @cancel="open = false"
      />
    </CommonModal>
  </section>
</template>

<style scoped lang="scss">

.certificates {
  display: grid;
  gap: 18px;
}

</style>
