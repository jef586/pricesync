<template>
  <span
    :class="[
      'permission-chip inline-flex items-center gap-1 px-2 py-1 rounded text-xs border',
      active ? 'permission-chip--active' : 'permission-chip--inactive'
    ]"
    role="checkbox"
    :aria-checked="active ? 'true' : 'false'"
    :aria-label="ariaLabel"
    tabindex="0"
    @click="onToggle"
    @keydown.space.prevent="onToggle"
    @keydown.enter.prevent="onToggle"
  >
    <svg v-if="active" class="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="permission-chip__label font-medium">{{ label || code }}</span>
    <span class="permission-chip__code">({{ code }})</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  code: string
  label?: string
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false
})

const ariaLabel = computed(() => {
  return `${props.label || props.code}: ${props.active ? 'habilitado' : 'no habilitado'}`
})

const emit = defineEmits(['toggle'])
function onToggle() {
  emit('toggle')
}
</script>

<style scoped>
/* Alto contraste con tokens (oscuro y claro) */
.permission-chip { border-color: var(--ps-border); }
.permission-chip__label { color: var(--ps-text-primary); }
.permission-chip__code { color: var(--ps-text-secondary); }
.permission-chip--inactive { background: color-mix(in srgb, var(--ps-bg) 6%, var(--ps-card)); }
.permission-chip--active { background: color-mix(in srgb, var(--ps-primary) 18%, var(--ps-card)); color: var(--ps-text-primary); border-color: color-mix(in srgb, var(--ps-primary) 35%, transparent); }
</style>