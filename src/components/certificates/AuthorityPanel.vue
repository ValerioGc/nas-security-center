<script setup lang="ts">

import { nextTick, ref } from 'vue';
import { useI18n } from '@/i18n';
import type { CertificateDetails } from '@/types';
import { formatMoment } from '@/utils/formatMoment';
import { NasIcon } from '@valeriogc/nas-base-app';
import downloadIcon from '@/assets/icons/download.svg?url';

interface Props {
  authority: CertificateDetails;
}

defineProps<Props>();

// Served by the gateway to every browser, with the type that lets some of them offer to trust it.
const AUTHORITY_URL = '/auth/ca.crt';
const PLATFORMS = ['windows', 'macos', 'linux', 'firefox', 'android', 'ios'] as const;

type Platform = (typeof PLATFORMS)[number];

const { t } = useI18n();
const chosen = ref<Platform>(PLATFORMS[0]);
const tabs = ref<HTMLButtonElement[]>([]);

/** The arrows move between the tabs, as in every tab list. */
async function move(step: number) {
  const index = PLATFORMS.indexOf(chosen.value);
  chosen.value = PLATFORMS[(index + step + PLATFORMS.length) % PLATFORMS.length];
  await nextTick();
  tabs.value[PLATFORMS.indexOf(chosen.value)]?.focus();
}

</script>

<!-- The authority of the NAS: what a browser has to trust for the NAS's own certificate. -->
<template>
  <section
    class="surface_card page_panel"
    :aria-label="t.authorityTitle"
    data-testid="certificate_authority"
  >
    <h2>{{ t.authorityTitle }}</h2>
    <p class="muted">{{ t.authorityNote }}</p>
    <dl class="authority_details">
      <dt>{{ t.authorityExpires }}</dt>
      <dd>{{ formatMoment(authority.notAfter * 1000) }}</dd>
      <dt>{{ t.fingerprint }}</dt>
      <dd>
        <code>{{ authority.fingerprint }}</code>
      </dd>
    </dl>
    <div class="app_toolbar">
      <a
        class="action_button primary"
        :href="AUTHORITY_URL"
        download="nas-os-ca.crt"
        data-testid="authority_download"
      >
        <NasIcon :svg="downloadIcon" />
        {{ t.downloadAuthority }}
      </a>
    </div>
    <section class="trust_guide" :aria-label="t.trustTitle" data-testid="trust_guide">
      <h3>{{ t.trustTitle }}</h3>
      <div class="trust_tabs" role="tablist" :aria-label="t.trustPlatforms">
        <button
          v-for="platform in PLATFORMS"
          :id="`trust_tab_${platform}`"
          :key="platform"
          ref="tabs"
          type="button"
          role="tab"
          :class="['trust_tab', { trust_tab_active: chosen === platform }]"
          :aria-selected="chosen === platform"
          aria-controls="trust_panel"
          :tabindex="chosen === platform ? 0 : -1"
          :data-testid="`trust_${platform}`"
          @click="chosen = platform"
          @keydown.right.prevent="move(1)"
          @keydown.left.prevent="move(-1)"
        >
          {{ t.trustSteps[platform].name }}
        </button>
      </div>
      <div
        id="trust_panel"
        class="trust_panel"
        role="tabpanel"
        :aria-labelledby="`trust_tab_${chosen}`"
      >
        <p class="muted">{{ t.trustSteps[chosen].browsers }}</p>
        <ol class="trust_steps">
          <li v-for="step in t.trustSteps[chosen].steps" :key="step">{{ step }}</li>
        </ol>
        <p class="trust_after">{{ t.trustAfter }}</p>
      </div>
    </section>
  </section>
</template>

<style scoped lang="scss">

h2 {
  margin: 0;
  font-size: 17px;
}

.authority_details {
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

  code {
    font-size: 12px;
  }
}

.trust_guide {
  display: grid;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--nas-border);

  h3 {
    margin: 0;
    font-size: 15px;
  }
}

.trust_tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.trust_tab {
  padding: 6px 12px;
  border: 1px solid var(--nas-border);
  border-radius: 999px;
  background: var(--nas-surface);
  color: var(--nas-muted);
  font-weight: 600;

  &:hover {
    color: var(--nas-foreground);
  }
}

.trust_tab_active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.trust_panel {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 9px;
  background: var(--nas-sunken);
}

// The steps numbered in a round mark, one after the other.
.trust_steps {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;

  li {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    counter-increment: step;

    &::before {
      content: counter(step);
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
    }
  }
}

.trust_after {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

</style>
