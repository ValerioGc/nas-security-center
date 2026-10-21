<script setup lang="ts">

import { onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useAccess } from '@/composables/useAccess';
import type { AccessRule, NewAccessRule } from '@/types';

import { NasNumberStepper, NasSwitch } from '@valeriogc/nas-base-app';
import AllowedAddresses from '@/components/access/AllowedAddresses.vue';

const { t } = useI18n();
const {
  settings,
  policy,
  discovery,
  rules,
  loading,
  error,
  policyUnavailable,
  ruleBusy,
  ruleError,
  discoveryBusy,
  discoveryError,
  load,
  save,
  saveDiscovery,
  addRule,
  removeRule,
} = useAccess();

async function add(rule: NewAccessRule, done: (added: boolean) => void) {
  done(await addRule(rule));
}

function remove(rule: AccessRule) {
  void removeRule(rule);
}

onMounted(load);

</script>

<template>
  <section :aria-label="t.sections.access">
    <header class="page_header">
      <h1>{{ t.sections.access }}</h1>
      <p>{{ t.accessIntro }}</p>
    </header>

    <p v-if="error" class="alert" role="alert" data-testid="access_error">
      <span class="alert_message">{{ error }}</span>
      <button type="button" class="action_button" @click="load">{{ t.retry }}</button>
    </p>

    <output v-if="loading && !settings" class="muted">{{ t.loading }}</output>

    <div v-if="settings">
      <div class="surface_card page_panel">
        <NasSwitch
          v-model="settings.notifyFailures"
          :label="t.notifyFailures"
          testid="access_notify"
          @update:model-value="save"
        />
        <p class="muted">{{ t.notifyFailuresNote }}</p>
      </div>

      <div class="surface_card page_panel" data-testid="access_lock">
        <template v-if="policy">
          <NasSwitch
            v-model="policy.enabled"
            :label="t.signInLock"
            testid="access_lock_enabled"
            @update:model-value="save"
          />
          <p class="muted">{{ t.signInLockNote }}</p>

          <div class="lock_fields">
            <label class="field" for="access_lock_attempts">
              {{ t.signInLockAttempts }}
              <NasNumberStepper
                id="access_lock_attempts"
                v-model="policy.attempts"
                :min="1"
                :max="20"
                :disabled="!policy.enabled"
                testid="access_lock_attempts"
                :increase-label="t.increase"
                :decrease-label="t.decrease"
                @update:model-value="save"
              />
            </label>

            <label class="field" for="access_lock_minutes">
              {{ t.signInLockMinutes }}
              <NasNumberStepper
                id="access_lock_minutes"
                v-model="policy.lockMinutes"
                :min="1"
                :max="1440"
                :disabled="!policy.enabled"
                testid="access_lock_minutes"
                :increase-label="t.increase"
                :decrease-label="t.decrease"
                @update:model-value="save"
              />
            </label>
          </div>
        </template>

        <p v-if="policyUnavailable" class="alert" role="alert">{{ t.signInLockUnavailable }}</p>
      </div>

      <div class="surface_card page_panel" data-testid="access_discovery">
        <template v-if="discovery">
          <NasSwitch
            v-model="discovery.enabled"
            :label="t.discovery"
            :disabled="discoveryBusy"
            testid="access_discovery_enabled"
            @update:model-value="saveDiscovery"
          />
          <p class="muted">{{ t.discoveryNote }}</p>
        </template>

        <p v-if="discoveryError" class="alert" role="alert" data-testid="access_discovery_error">
          {{ discoveryError }}
        </p>
      </div>
    </div>

    <AllowedAddresses
      v-if="settings"
      :rules="rules"
      :busy="ruleBusy"
      :error="ruleError"
      @add="add"
      @remove="remove"
    />
  </section>
</template>

<style scoped lang="scss">

.alert {
  @extend %fx_between;
  gap: 12px;
  margin-bottom: 20px;
}

.lock_fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

</style>
