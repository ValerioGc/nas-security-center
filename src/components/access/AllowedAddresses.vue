<script setup lang="ts">

import { nextTick, ref } from 'vue';
import { useI18n } from '@/i18n';
import { formatMoment } from '@/utils/formatMoment';
import type { AccessRule, AccessRuleKind, NewAccessRule } from '@/types';
import { NasIcon } from '@valeriogc/nas-base-app';
import addIcon from '@/assets/icons/add.svg?url';
import deleteIcon from '@/assets/icons/delete.svg?url';

interface Props {
  rules: AccessRule[];
  busy: boolean;
  error: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  add: [rule: NewAccessRule, done: (added: boolean) => void];
  remove: [rule: AccessRule];
}>();

const KINDS: AccessRuleKind[] = ['ip', 'range'];

const { t } = useI18n();
const adding = ref(false);
const kind = ref<AccessRuleKind>('ip');
const value = ref('');
const label = ref('');
const valueField = ref<HTMLInputElement | null>(null);

async function open() {
  adding.value = true;
  await nextTick();
  valueField.value?.focus();
}

/** Sends the new rule; the fields close and empty themselves only once the launcher took it. */
function submit() {
  if (props.busy || !value.value.trim()) {
    return;
  }
  emit(
    'add',
    { kind: kind.value, value: value.value.trim(), label: label.value.trim() },
    (added) => {
      if (added) {
        value.value = '';
        label.value = '';
        adding.value = false;
      }
    },
  );
}

</script>

<template>
  <section class="surface_card page_panel" :aria-label="t.allowedAddresses">
    <div class="panel_heading">
      <h2>{{ t.allowedAddresses }}</h2>
      <button
        v-if="!adding"
        type="button"
        class="action_button primary"
        data-testid="access_rule_open"
        @click="open"
      >
        <NasIcon :svg="addIcon" />
        {{ t.add }}
      </button>
    </div>

    <p class="muted" data-testid="access_rules_note">
      {{ rules.length ? t.allowedAddressesOn : t.allowedAddressesOff }}
    </p>

    <form
      v-if="adding"
      class="rule_form"
      :aria-label="t.addAddress"
      data-testid="access_rule_form"
      @submit.prevent="submit"
    >
      <h3>{{ t.addAddress }}</h3>

      <div class="field">
        {{ t.accessRuleKind }}
        <fieldset class="segmented" :aria-label="t.accessRuleKind">
          <button
            v-for="option in KINDS"
            :key="option"
            type="button"
            :aria-pressed="kind === option"
            :data-testid="`access_rule_kind_${option}`"
            @click="kind = option"
          >
            {{ t.ruleKinds[option] }}
          </button>
        </fieldset>
      </div>

      <label class="field">
        {{ t.accessRuleValue }}
        <input
          ref="valueField"
          v-model="value"
          type="text"
          maxlength="64"
          autocapitalize="none"
          :spellcheck="false"
          :placeholder="t.ruleHints[kind]"
          data-testid="access_rule_value"
        />
      </label>

      <label class="field">
        {{ t.accessRuleLabel }}
        <input
          v-model="label"
          type="text"
          maxlength="64"
          :placeholder="t.accessRuleLabelHint"
          data-testid="access_rule_label"
        />
      </label>

      <div class="app_toolbar rule_actions">
        <button
          type="button"
          class="action_button"
          data-testid="access_rule_cancel"
          @click="adding = false"
        >
          {{ t.cancel }}
        </button>
        <button
          type="submit"
          class="action_button primary"
          :disabled="busy || !value.trim()"
          data-testid="access_rule_add"
        >
          {{ t.add }}
        </button>
      </div>
    </form>

    <p v-if="error" class="alert" role="alert" data-testid="access_rule_error">{{ error }}</p>

    <div v-if="rules.length" class="app_scroll">
      <table data-testid="access_rules">
        <thead>
          <tr>
            <th>{{ t.accessRuleKind }}</th>
            <th>{{ t.accessRuleValue }}</th>
            <th>{{ t.accessRuleLabel }}</th>
            <th>{{ t.addedOn }}</th>
            <th>
              <span class="sr_only">{{ t.remove }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in rules" :key="rule.id" :data-testid="`access_rules_row_${rule.id}`">
            <td>{{ t.ruleKinds[rule.kind] }}</td>
            <td class="rule_value">{{ rule.value }}</td>
            <td>{{ rule.label || '-' }}</td>
            <td>{{ formatMoment(rule.createdAt) }}</td>
            <td class="rule_remove">
              <button
                type="button"
                class="icon_button"
                :disabled="busy"
                :aria-label="`${t.remove} ${rule.value}`"
                :title="t.remove"
                @click="emit('remove', rule)"
              >
                <NasIcon :svg="deleteIcon" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="muted">{{ t.noAllowedAddresses }}</p>
  </section>
</template>

<style scoped lang="scss">

.panel_heading {
  @extend %fx_between;
  gap: 12px;
}

.rule_form {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--accent);
  border-radius: 10px;
  background: var(--nas-sunken);

  h3 {
    margin: 0;
    font-size: 15px;
  }
}

.segmented {
  display: inline-flex;
  width: fit-content;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 1px solid var(--nas-border);
  border-radius: 9px;
  overflow: hidden;

  button {
    padding: 8px 14px;
    border: 0;
    background: var(--nas-surface);
    color: var(--nas-foreground);

    &[aria-pressed='true'] {
      background: var(--accent);
      color: var(--on-accent);
    }
  }
}

.rule_actions {
  justify-content: flex-end;
}

th,
td {
  padding: 12px 10px;
  font-size: 13px;
}

th {
  color: var(--nas-muted);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rule_value {
  font-family: ui-monospace, monospace;
}

.rule_remove {
  width: 1%;
  text-align: right;
}

</style>
