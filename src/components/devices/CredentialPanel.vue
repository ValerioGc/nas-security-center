<script setup lang="ts">

import { useI18n } from '@/i18n';
import type { DeviceCredential } from '@/types';
import { fromBase64, saveFile } from '@/utils/saveFile';
import { NasIcon } from '@valeriogc/nas-base-app';
import downloadIcon from '@/assets/icons/download.svg?url';

interface Props {
  credential: DeviceCredential;
}

const props = defineProps<Props>();

const { t } = useI18n();

// Served by the gateway to every browser: what a device trusts before anything else.
const AUTHORITY_URL = '/auth/ca.crt';

function saveCertificate() {
  saveFile(fromBase64(props.credential.file), props.credential.fileName, 'application/x-pkcs12');
}

</script>

<!-- The certificate just issued for a device, with the password of its file: shown once. -->
<template>
  <div class="credential" data-testid="credential">
    <section class="credential_part">
      <h3>{{ t.credentialTitle }}</h3>
      <p class="muted">{{ t.credentialNote }}</p>
      <button
        type="button"
        class="action_button primary"
        data-testid="credential_download"
        @click="saveCertificate"
      >
        <NasIcon :svg="downloadIcon" />
        {{ t.downloadCertificate }}
      </button>
      <span class="muted">{{ t.credentialPassword }}</span>
      <code class="credential_password" data-testid="credential_password">
        {{ credential.password }}
      </code>
      <p class="muted">{{ t.credentialPasswordNote }}</p>
    </section>

    <section class="credential_part">
      <h3>{{ t.authorityTitle }}</h3>
      <p class="muted">{{ t.authorityNote }}</p>
      <a
        class="action_button"
        :href="AUTHORITY_URL"
        download="nas-os-ca.crt"
        data-testid="credential_authority"
      >
        <NasIcon :svg="downloadIcon" />
        {{ t.downloadAuthority }}
      </a>
    </section>
  </div>
</template>

<style scoped lang="scss">

.credential {
  display: grid;
  gap: 14px;
}

.credential_part {
  display: grid;
  justify-items: start;
  gap: 8px;
  padding: 16px;
  border-radius: 10px;
  background: var(--nas-sunken);

  h3 {
    margin: 0;
    font-size: 15px;
  }
}

.credential_password {
  padding: 8px 12px;
  border: 1px solid var(--nas-border);
  border-radius: 8px;
  background: var(--nas-surface);
  font-family: ui-monospace, monospace;
  font-size: 15px;
  user-select: all;
}

a.action_button {
  text-decoration: none;
}

</style>
