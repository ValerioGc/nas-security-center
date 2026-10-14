<script setup lang="ts">

import { useI18n } from '@/i18n';
import type { Section } from '@/types';
import { NasIcon } from '@valeriogc/nas-base-app';
import access from '@/assets/icons/access.svg?url';
import antivirus from '@/assets/icons/antivirus.svg?url';
import certificates from '@/assets/icons/certificates.svg?url';
import devices from '@/assets/icons/devices.svg?url';
import logs from '@/assets/icons/logs.svg?url';

const SECTIONS: Section[] = ['access', 'devices', 'antivirus', 'certificates', 'logs'];
const ICONS: Record<Section, string> = { access, devices, antivirus, certificates, logs };

const section = defineModel<Section>({ required: true });

const { t } = useI18n();

</script>

<template>
  <aside class="sidebar" :aria-label="t.sectionsLabel">
    <nav>
      <button
        v-for="item in SECTIONS"
        :key="item"
        type="button"
        :class="['nav_item', { 'active': section === item }]"
        :aria-current="section === item ? 'page' : undefined"
        :data-testid="`section_${item}`"
        @click="section = item"
      >
        <NasIcon class="nav_symbol" :svg="ICONS[item]" />
        {{ t.sections[item] }}
      </button>
    </nav>
  </aside>
</template>

<style scoped lang="scss">

.sidebar {
  position: sticky;
  top: 0;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 28px 16px;
  background: $nas_sidebar_background;
  color: $nas_sidebar_foreground;
}

nav {
  display: grid;
  gap: 4px;
}

.nav_item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: $nas_sidebar_muted;
  text-align: left;

  &:hover,
  &.active {
    background: var(--nas-hover);
    color: $nas_sidebar_foreground;
  }

  &.active {
    box-shadow: inset 3px 0 var(--accent);
  }
}

.nav_symbol {
  --app-icon-size: 20px;
}

@media (max-width: $nas_mobile_breakpoint) {
  .sidebar {
    padding: 12px 16px;
  }

  nav {
    display: flex;
    overflow-x: auto;
  }

  .nav_item {
    white-space: nowrap;
  }
}

</style>
