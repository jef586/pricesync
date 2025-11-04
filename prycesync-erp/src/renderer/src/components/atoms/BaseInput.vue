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
      :step="step"
      :min="min"
      :max="max"
      :aria-invalid="hasError ? 'true' : undefined"
      :class="[
        'base-input__field',
        {
          'base-input__field--error': hasError,
          'base-input__field--disabled': disabled
        }
      ]"
      v-bind="$attrs"
      @input="handleInput"
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
  modelValue: string | number
  label?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hasError?: boolean
  errorMessage?: string
  id?: string
  step?: string
  min?: string | number
  max?: string | number
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
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

const emit = defineEmits<Emits>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  // Si es un input de tipo number, convertir a número
  if (target.type === 'number') {
    const numValue = parseFloat(value)
    emit('update:modelValue', isNaN(numValue) ? 0 : numValue)
  } else {
    emit('update:modelValue', value)
  }
}
</script>

<style scoped>
.base-input {
  @apply w-full mb-4;
}

.base-input__label {
  @apply block text-sm font-semibold mb-2;
  color: var(--ps-text-secondary);
}

.base-input__required {
  @apply text-red-500;
}

.base-input__field {
  @apply w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200;
  background: var(--ps-input-bg);
  color: var(--ps-text-primary);
  border-color: var(--ps-border);
}

.base-input__field::placeholder { color: var(--ps-text-secondary); }
.base-input__field:focus { border-color: var(--ps-primary); }

.base-input__field--error {
  @apply border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50;
}

.base-input__field--disabled {
  @apply cursor-not-allowed;
  background: var(--ps-card);
  color: var(--ps-text-secondary);
}

.base-input__error {
  @apply mt-2 text-sm text-red-600 font-medium;
}
</style>