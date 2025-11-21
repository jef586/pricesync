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
  size?: 'sm' | 'md' | 'lg' | 'large'
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
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800;
}

.base-button--secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400;
}

.base-button--danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800;
}

.base-button--ghost {
  /* Themed ghost button for light/dark using design tokens */
  background: transparent;
  color: var(--ps-text-primary);
  /* subtle hover using card/background mix to work across themes */
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: none;
  /* Using color-mix ensures readable hover both in light and dark */
  /* Fallback for environments without color-mix: keep transparent */
}

.base-button--ghost:hover {
  background: color-mix(in srgb, var(--ps-card) 90%, var(--ps-primary));
}

.base-button--ghost:focus {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ps-card) 85%, var(--ps-primary));
}

.base-button--ghost:active {
  background: color-mix(in srgb, var(--ps-card) 85%, var(--ps-primary));
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

.base-button--large {
  @apply px-10 py-4 text-lg;
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
