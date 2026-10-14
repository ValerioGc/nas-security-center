<script setup lang="ts">

import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';

interface Props {
  note: string;
  action: string;
  busy?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), { busy: false, error: '' });

const emit = defineEmits<{
  confirm: [password: string];
  cancel: [];
}>();

const { t } = useI18n();
const password = ref('');
const field = ref<HTMLInputElement | null>(null);
const ready = computed(() => password.value.length > 0 && !props.busy);

function submit() {
  if (ready.value) {
    emit('confirm', password.value);
  }
}

onMounted(() => field.value?.focus());

</script>

<template>
  <form class="password_confirm" data-testid="password_confirm" @submit.prevent="submit">
    <p class="muted">{{ note }}</p>
    <label class="field">
      {{ t.accountPassword }}
      <input
        ref="field"
        v-model="password"
        type="password"
        maxlength="128"
        autocomplete="current-password"
        data-testid="password_confirm_input"
      />
    </label>
    <p v-if="error" class="alert" role="alert" data-testid="password_confirm_error">{{ error }}</p>
    <div class="app_toolbar password_confirm_actions">
      <button type="button" class="action_button" @click="emit('cancel')">{{ t.cancel }}</button>
      <button
        type="submit"
        class="action_button primary"
        :disabled="!ready"
        data-testid="password_confirm_submit"
      >
        {{ action }}
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss">

.password_confirm {
  display: grid;
  gap: 14px;
}

.password_confirm_actions {
  justify-content: flex-end;
}

</style>
