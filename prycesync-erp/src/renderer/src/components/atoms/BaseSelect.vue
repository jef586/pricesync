<template>
  <div class="base-select">
    <label v-if="label" :for="id" class="base-select__label">
      {{ label }}
      <span v-if="required" class="base-select__required">*</span>
    </label>
    <select
      :id="id"
      :value="normalizedModelValue"
      :required="required"
      :disabled="disabled"
      :aria-invalid="hasError ? 'true' : undefined"
      :class="[
        'base-select__field',
        {
          'base-select__field--error': hasError,
          'base-select__field--disabled': disabled
        }
      ]"
      v-bind="$attrs"
      @change="onChange($event)"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value ?? ''"
      >
        {{ option.label }}
      </option>
    </select>
    <span v-if="hasError && errorMessage" class="base-select__error">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  value: string | null
  label: string
}

interface Props {
  modelValue: string | null
  label?: string
  placeholder?: string
  options: Option[]
  required?: boolean
  disabled?: boolean
  hasError?: boolean
  errorMessage?: string
  id?: string
}

interface Emits {
  (e: 'update:modelValue', value: string | null): void
  (e: 'blur'): void
  (e: 'focus'): void
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  hasError: false,
  id: () => `select-${Math.random().toString(36).substr(2, 9)}`
})

const emit = defineEmits<Emits>()

const normalizedModelValue = computed(() => props.modelValue ?? '')

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value === '' ? null : value)
}
</script>

<style scoped>
.base-select {
  @apply w-full mb-4;
}

.base-select__label {
  @apply block text-sm font-semibold mb-2;
  color: var(--ps-text-secondary);
}

.base-select__required {
  @apply text-red-500;
}

.base-select__field {
  @apply w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer;
  background: var(--ps-input-bg);
  color: var(--ps-text-primary);
  border-color: var(--ps-border);
}

.base-select__field--error {
  @apply border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50;
}

.base-select__field--disabled {
  @apply cursor-not-allowed;
  background: var(--ps-card);
  color: var(--ps-text-secondary);
}

.base-select__error {
  @apply mt-2 text-sm text-red-600 font-medium;
}

/* Custom arrow styling */
.base-select__field {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>