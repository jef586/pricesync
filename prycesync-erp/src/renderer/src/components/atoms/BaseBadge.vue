<template>
  <span class="base-badge" :class="variantClass"><slot /></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
interface Props { variant?: 'neutral' | 'success' | 'warning' | 'danger' }
const props = withDefaults(defineProps<Props>(), { variant: 'neutral' })
const variantClass = computed(() => {
  if (props.variant === 'success') return 'base-badge--success'
  if (props.variant === 'warning') return 'base-badge--warning'
  if (props.variant === 'danger') return 'base-badge--danger'
  return 'base-badge--neutral'
})
</script>

<style scoped>
.base-badge { display:inline-flex; align-items:center; gap:.25rem; padding:.125rem .5rem; font-size:.75rem; line-height:1rem; border-radius:9999px; border: var(--ps-border-width) solid var(--ps-border); background: var(--ps-card); color: var(--ps-text-primary); }
.base-badge--success { background: color-mix(in srgb, var(--ps-success) 20%, var(--ps-card)); border-color: color-mix(in srgb, var(--ps-success) 70%, var(--ps-border)); color: var(--ps-success-contrast, #fff); }
.base-badge--warning { background: color-mix(in srgb, var(--ps-warning) 20%, var(--ps-card)); border-color: color-mix(in srgb, var(--ps-warning) 70%, var(--ps-border)); color: var(--ps-warning-contrast, #fff); }
.base-badge--danger { background: color-mix(in srgb, var(--ps-danger) 20%, var(--ps-card)); border-color: color-mix(in srgb, var(--ps-danger) 70%, var(--ps-border)); color: var(--ps-danger-contrast, #fff); }
.base-badge--neutral { background: var(--ps-card); border-color: var(--ps-border); color: var(--ps-text-secondary); }
</style>
