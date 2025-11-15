<template>
  <div class="base-select">
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="[
        'base-select__field',
        {
          'base-select__field--disabled': disabled,
          'base-select__field--error': error
        }
      ]"
      @change="handleChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <slot />
    </select>
    <div v-if="error" class="base-select__error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  error?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  error: ''
})

const emit = defineEmits<Emits>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.base-select {
  @apply w-full;
}

.base-select__field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200;
}

.base-select__field--disabled {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

.base-select__field--error {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

.base-select__error {
  @apply mt-1 text-sm text-red-600;
}

/* Dark mode support using design tokens */
.base-select__field {
  background: var(--ps-card);
  border: var(--ps-border-width) solid var(--ps-border);
  color: var(--ps-text-primary);
  border-radius: var(--ps-radius-md);
}

.base-select__field:focus {
  border-color: var(--ps-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ps-primary) 30%, transparent);
}

.base-select__field--disabled {
  background: color-mix(in srgb, var(--ps-bg) 5%, var(--ps-card));
  color: var(--ps-text-secondary);
}

.base-select__error {
  color: var(--ps-danger);
}
</style>