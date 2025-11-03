<template>
  <div class="form-field" :class="fieldClasses">
    <!-- Label -->
    <label 
      v-if="label" 
      :for="fieldId" 
      class="form-field__label"
      :class="labelClasses"
    >
      {{ label }}
      <span v-if="required" class="form-field__required">*</span>
    </label>

    <!-- Help text (above input) -->
    <div v-if="helpText && helpPosition === 'top'" class="form-field__help form-field__help--top">
      {{ helpText }}
    </div>

    <!-- Input slot -->
    <div class="form-field__input-wrapper">
      <slot :field-id="fieldId" :has-error="hasError" />
    </div>

    <!-- Error message -->
    <div v-if="hasError" class="form-field__error">
      <svg class="form-field__error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {{ error }}
    </div>

    <!-- Help text (below input) -->
    <div v-if="helpText && helpPosition === 'bottom'" class="form-field__help form-field__help--bottom">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  label?: string
  error?: string
  helpText?: string
  helpPosition?: 'top' | 'bottom'
  required?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'floating'
}

const props = withDefaults(defineProps<Props>(), {
  helpPosition: 'bottom',
  size: 'md',
  variant: 'default'
})

// Generate unique ID for accessibility
const fieldId = useId()

// Computed properties
const hasError = computed(() => !!props.error)

const fieldClasses = computed(() => {
  const classes = ['form-field']
  
  if (props.size) {
    classes.push(`form-field--${props.size}`)
  }
  
  if (props.variant) {
    classes.push(`form-field--${props.variant}`)
  }
  
  if (hasError.value) {
    classes.push('form-field--error')
  }
  
  if (props.disabled) {
    classes.push('form-field--disabled')
  }
  
  return classes
})

const labelClasses = computed(() => {
  const classes = []
  
  if (props.required) {
    classes.push('form-field__label--required')
  }
  
  if (props.disabled) {
    classes.push('form-field__label--disabled')
  }
  
  return classes
})
</script>

<style scoped>
.form-field {
  @apply space-y-1;
}

.form-field--sm {
  @apply space-y-1;
}

.form-field--md {
  @apply space-y-2;
}

.form-field--lg {
  @apply space-y-3;
}

.form-field__label {
  @apply block text-sm font-medium;
  color: var(--ps-text-secondary);
}

.form-field__label--disabled { color: var(--ps-text-secondary); opacity: 0.6; }

.form-field__required {
  @apply text-red-500 ml-1;
}

.form-field__input-wrapper {
  @apply relative;
}

.form-field__help {
  @apply text-sm;
  color: var(--ps-text-secondary);
}

.form-field__help--top {
  @apply mb-1;
}

.form-field__help--bottom {
  @apply mt-1;
}

.form-field__error {
  @apply flex items-start space-x-1 text-sm text-red-600;
}

.form-field__error-icon {
  @apply w-4 h-4 mt-0.5 flex-shrink-0;
}

/* Floating label variant */
.form-field--floating .form-field__label {
  @apply absolute left-3 top-2 text-gray-500 transition-all duration-200 pointer-events-none;
  transform-origin: left top;
}

.form-field--floating .form-field__input-wrapper:focus-within .form-field__label,
.form-field--floating .form-field__input-wrapper .form-field__label--active {
  @apply text-xs text-blue-600;
  transform: translateY(-1.5rem) scale(0.875);
}

/* Error state */
.form-field--error .form-field__label {
  @apply text-red-700;
}

/* Disabled state */
.form-field--disabled {
  @apply opacity-50 pointer-events-none;
}
</style>