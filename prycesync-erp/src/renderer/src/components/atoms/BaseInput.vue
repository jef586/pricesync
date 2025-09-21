<template>
  <div class="base-input">
    <label v-if="label" :for="id" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>
    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="[
        'base-input__field',
        {
          'base-input__field--error': hasError,
          'base-input__field--disabled': disabled
        }
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    />
    <span v-if="hasError && errorMessage" class="base-input__error">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'tel'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hasError?: boolean
  errorMessage?: string
  id?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  hasError: false,
  id: () => `input-${Math.random().toString(36).substr(2, 9)}`
})

defineEmits<Emits>()
</script>

<style scoped>
.base-input {
  @apply w-full mb-4;
}

.base-input__label {
  @apply block text-sm font-semibold text-gray-700 mb-2;
}

.base-input__required {
  @apply text-red-500;
}

.base-input__field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900;
}

.base-input__field--error {
  @apply border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50;
}

.base-input__field--disabled {
  @apply bg-gray-50 text-gray-500 cursor-not-allowed;
}

.base-input__error {
  @apply mt-2 text-sm text-red-600 font-medium;
}
</style>