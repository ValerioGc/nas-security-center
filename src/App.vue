<script setup lang="ts">

import { ref } from 'vue';
import { useNasLauncherContext } from '@/composables/useNasLauncherContext';
import type { Section } from '@/types';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AntivirusPage from '@/components/sections/AntivirusPage.vue';
import AccessPage from '@/components/sections/AccessPage.vue';
import CertificatesPage from '@/components/sections/CertificatesPage.vue';
import DevicesPage from '@/components/sections/DevicesPage.vue';
import SecurityLogsPage from '@/components/sections/SecurityLogsPage.vue';

useNasLauncherContext();

const SECTIONS: readonly Section[] = ['access', 'devices', 'certificates', 'logs', 'antivirus'];

/** The section the launcher asked for (`?section=`, from the link of a notification), or access. */
function requested(): Section {
  const asked = new URL(window.location.href).searchParams.get('section');
  return SECTIONS.find((known) => known === asked) ?? 'access';
}

const section = ref<Section>(requested());

</script>

<template>
  <div class="app_shell app_surface">
    <AppSidebar v-model="section" />

    <main class="content" data-testid="app_content">
      <AccessPage v-if="section === 'access'" />
      <DevicesPage v-else-if="section === 'devices'" />
      <CertificatesPage v-else-if="section === 'certificates'" />
      <AntivirusPage v-else-if="section === 'antivirus'" />
      <SecurityLogsPage v-else />
    </main>
  </div>
</template>

<style scoped lang="scss">

.app_shell {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 228px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
}

.content {
  position: relative;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  width: 100%;
  max-width: 1500px;
  padding: 42px clamp(20px, 4vw, 64px);
  background: var(--nas-app-content, var(--app-bg));
}

@media (max-width: $nas_mobile_breakpoint) {
  .app_shell {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }

  .content {
    padding: 26px 16px;
  }
}

</style>
