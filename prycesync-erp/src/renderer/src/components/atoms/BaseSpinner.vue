<template>
  <div class="base-spinner" :class="sizeClass" role="status" aria-live="polite" aria-busy="true"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
interface Props { size?: 'sm' | 'md' | 'lg' }
const props = withDefaults(defineProps<Props>(), { size: 'md' })
const sizeClass = computed(() => (props.size === 'sm' ? 'base-spinner--sm' : props.size === 'lg' ? 'base-spinner--lg' : 'base-spinner--md'))
</script>

<style scoped>
.base-spinner { border: 3px solid var(--ps-border); border-top-color: var(--ps-primary); border-radius: 9999px; animation: spin 1s linear infinite; }
.base-spinner--sm { width: 16px; height: 16px; }
.base-spinner--md { width: 24px; height: 24px; }
.base-spinner--lg { width: 32px; height: 32px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
