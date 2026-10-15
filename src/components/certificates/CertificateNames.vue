<script setup lang="ts">

import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import { validCertificateName } from '@/utils/certificateName';
import { NasIcon } from '@valeriogc/nas-base-app';
import addIcon from '@/assets/icons/add.svg?url';
import closeIcon from '@/assets/icons/close.svg?url';

interface Props {
  extra: string[];
  custom: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [names: string[]];
}>();

const LIMIT = 20;

const { t } = useI18n();
const draft = ref<string[]>([]);
const typed = ref('');

watch(
  () => props.extra,
  (saved) => (draft.value = [...saved]),
  { immediate: true },
);

const candidate = computed(() => typed.value.trim().toLowerCase());
const invalid = computed(() => candidate.value !== '' && !validCertificateName(candidate.value));
const changed = computed(() => draft.value.join('\n') !== props.extra.join('\n'));

function add() {
  if (!candidate.value || invalid.value || draft.value.length >= LIMIT) {
    return;
  }
  if (!draft.value.includes(candidate.value)) {
    draft.value.push(candidate.value);
  }
  typed.value = '';
}

function remove(name: string) {
  draft.value = draft.value.filter((item) => item !== name);
}

</script>

<template>
  <section
    class="surface_card page_panel"
    :aria-label="t.extraNamesTitle"
    data-testid="certificate_extra_names"
  >
    <h2>{{ t.extraNamesTitle }}</h2>
    <p class="muted">{{ t.extraNamesNote }}</p>
    <p v-if="custom" class="muted" data-testid="certificate_custom_note">
      {{ t.customActiveNote }}
    </p>

    <ul v-if="draft.length" class="name_list">
      <li v-for="name in draft" :key="name">
        <span>{{ name }}</span>
        <button
          type="button"
          class="name_remove"
          :aria-label="`${t.remove} ${name}`"
          @click="remove(name)"
        >
          <NasIcon :svg="closeIcon" />
        </button>
      </li>
    </ul>

    <form class="name_form" @submit.prevent="add">
      <label class="field">
        <input
          v-model="typed"
          type="text"
          :aria-label="t.extraNamesTitle"
          autocapitalize="none"
          :placeholder="t.extraNameHint"
          :aria-invalid="invalid"
          maxlength="253"
          data-testid="extra_name_input"
        />
      </label>
      <button
        type="submit"
        class="action_button"
        :disabled="!candidate || invalid || draft.length >= LIMIT"
        data-testid="extra_name_add"
      >
        <NasIcon :svg="addIcon" />
        {{ t.addName }}
      </button>
    </form>
    <p v-if="invalid" class="alert" role="alert">{{ t.invalidName }}</p>

    <div class="app_toolbar">
      <button
        type="button"
        class="action_button primary"
        :disabled="!changed"
        data-testid="extra_names_save"
        @click="emit('save', [...draft])"
      >
        {{ t.saveNames }}
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">

h2 {
  margin: 0;
  font-size: 17px;
}

.name_list {
  @extend %reset_list;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  li {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 4px 4px 10px;
    border-radius: 8px;
    background: var(--nas-sunken);
  }
}

.name_remove {
  --app-icon-size: 14px;
  display: inline-grid;
  place-items: center;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--nas-muted);

  &:hover {
    background: var(--nas-hover);
    color: inherit;
  }
}

.name_form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;

  .field {
    flex: 0 1 18rem;
    width: 18rem;
    max-width: 100%;
  }
}

</style>
