<template>
  <button :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger
  size: { type: String, default: 'md' }, // sm | md | lg
  class: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const classes = computed(() => {
  const base = 'ps-btn '
  const variant = props.variant === 'secondary'
    ? 'ps-btn--secondary'
    : props.variant === 'danger'
    ? 'ps-btn--danger'
    : 'ps-btn--primary'

  const size = props.size === 'sm'
    ? 'text-sm px-2 py-1'
    : props.size === 'lg'
    ? 'text-base px-4 py-2'
    : 'text-sm px-3 py-1.5'

  const disabled = props.disabled ? 'opacity-60 cursor-not-allowed' : ''
  return [base, variant, size, disabled, props.class].join(' ').trim()
})
</script>

<style scoped>
button { height: 36px; }
</style>