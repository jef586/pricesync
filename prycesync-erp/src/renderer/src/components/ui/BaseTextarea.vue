<template>
  <div class="base-textarea">
    <label v-if="label" :for="id" class="base-textarea__label">
      {{ label }}
      <span v-if="required" class="base-textarea__required">*</span>
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxlength"
      :class="[
        'base-textarea__field',
        {
          'base-textarea__field--error': error,
          'base-textarea__field--disabled': disabled
        }
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    />
    <div v-if="maxlength" class="base-textarea__counter">
      {{ (modelValue || '').length }}/{{ maxlength }}
    </div>
    <span v-if="error && errorMessage" class="base-textarea__error">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  rows?: number
  maxlength?: number
  id?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  required: false,
  disabled: false,
  error: false,
  rows: 3,
  id: () => `textarea-${Math.random().toString(36).substr(2, 9)}`
})

defineEmits<Emits>()
</script>

<style scoped>
.base-textarea {
  @apply w-full;
}

.base-textarea__label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.base-textarea__required {
  @apply text-red-500;
}

.base-textarea__field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 resize-y;
}

.base-textarea__field--error {
  @apply border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50;
}

.base-textarea__field--disabled {
  @apply bg-gray-50 text-gray-500 cursor-not-allowed resize-none;
}

.base-textarea__counter {
  @apply text-xs text-gray-500 text-right mt-1;
}

.base-textarea__error {
  @apply mt-1 text-sm text-red-600;
}
</style>