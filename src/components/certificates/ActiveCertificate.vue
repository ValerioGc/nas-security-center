<script setup lang="ts">

import { useI18n } from '@/i18n';
import type { CertificateDetails } from '@/types';
import { formatMoment } from '@/utils/formatMoment';
import { NasIcon } from '@valeriogc/nas-base-app';
import refreshIcon from '@/assets/icons/refresh.svg?url';
import revokeIcon from '@/assets/icons/revoke.svg?url';

interface Props {
  certificate: CertificateDetails;
  custom: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  renew: [];
  restore: [];
}>();

const { t } = useI18n();

</script>

<!-- The certificate HTTPS answers with now, and what can be done with it. -->
<template>
  <section
    class="surface_card page_panel"
    :aria-label="t.activeCertificate"
    data-testid="active_certificate"
  >
    <header class="certificate_header">
      <h2>{{ t.activeCertificate }}</h2>
      <span class="certificate_source" data-testid="certificate_source">
        {{ custom ? t.certificateSources.custom : t.certificateSources.nas }}
      </span>
    </header>
    <dl class="certificate_details">
      <dt>{{ t.certificateSubject }}</dt>
      <dd>{{ certificate.subject }}</dd>
      <dt>{{ t.certificateIssuer }}</dt>
      <dd>{{ certificate.issuer }}</dd>
      <dt>{{ t.certificateNames }}</dt>
      <dd>
        <ul class="certificate_names" data-testid="certificate_names">
          <li v-for="name in certificate.names" :key="name">{{ name }}</li>
        </ul>
      </dd>
      <dt>{{ t.validFrom }}</dt>
      <dd>{{ formatMoment(certificate.notBefore * 1000) }}</dd>
      <dt>{{ t.expiresOn }}</dt>
      <dd>{{ formatMoment(certificate.notAfter * 1000) }}</dd>
      <dt>{{ t.fingerprint }}</dt>
      <dd>
        <code class="certificate_fingerprint">{{ certificate.fingerprint }}</code>
      </dd>
    </dl>
    <div class="app_toolbar">
      <button
        v-if="custom"
        type="button"
        class="action_button"
        data-testid="certificate_restore"
        @click="emit('restore')"
      >
        <NasIcon :svg="revokeIcon" />
        {{ t.useNasCertificate }}
      </button>
      <button
        v-else
        type="button"
        class="action_button"
        data-testid="certificate_renew"
        @click="emit('renew')"
      >
        <NasIcon :svg="refreshIcon" />
        {{ t.renewServerCertificate }}
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">

.certificate_header {
  @extend %fx_between;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 17px;
  }
}

.certificate_source {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
}

.certificate_details {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px 16px;
  margin: 0;

  dt {
    color: var(--nas-muted);
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
  }
}

.certificate_names {
  @extend %reset_list;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  li {
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--nas-sunken);
    font-size: 13px;
  }
}

.certificate_fingerprint {
  font-size: 12px;
  overflow-wrap: anywhere;
}

</style>
