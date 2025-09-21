<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      {
        'base-button--loading': loading,
        'base-button--disabled': disabled,
        'base-button--full-width': fullWidth
      }
    ]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="base-button__spinner"></span>
    <slot v-if="!loading" />
    <span v-if="loading">{{ loadingText }}</span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  loadingText: 'Cargando...',
  fullWidth: false
})

defineEmits<Emits>()
</script>

<style scoped>
.base-button {
  @apply inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md;
}

/* Variants */
.base-button--primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800;
}

.base-button--secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400;
}

.base-button--danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800;
}

.base-button--ghost {
  @apply bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200 shadow-none hover:shadow-sm;
}

/* Sizes */
.base-button--sm {
  @apply px-4 py-2 text-sm;
}

.base-button--md {
  @apply px-6 py-3 text-sm;
}

.base-button--lg {
  @apply px-8 py-4 text-base;
}

/* States */
.base-button--loading {
  @apply cursor-wait;
}

.base-button--disabled {
  @apply cursor-not-allowed;
}

.base-button--full-width {
  @apply w-full;
}

/* Spinner */
.base-button__spinner {
  @apply inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin;
}
</style>