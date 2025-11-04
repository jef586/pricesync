<template>
  <div
    class="role-badge flex items-start gap-2 p-2 rounded border"
    :class="[selected ? 'role-badge--selected' : 'role-badge--default']"
    role="button"
    :aria-selected="selected ? 'true' : 'false'"
    tabindex="0"
    @click="$emit('select', role)"
    @keydown.enter="$emit('select', role)"
  >
    <div :class="['w-2 h-2 mt-2 rounded-full', dotClass]" aria-hidden="true"></div>
    <div class="flex-1">
      <div class="role-badge__title text-sm font-medium">{{ label || role }}</div>
      <div v-if="description" class="role-badge__desc text-xs">{{ description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
interface Props {
  role: string
  label?: string
  description?: string
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

const dotClass = computed(() => {
  const map: Record<string, string> = {
    SUPERADMIN: 'bg-purple-600',
    ADMIN: 'bg-blue-600',
    SUPERVISOR: 'bg-emerald-600',
    SELLER: 'bg-amber-600',
    TECHNICIAN: 'bg-gray-600'
  }
  return map[props.role] || 'bg-gray-400'
})
</script>

<style scoped>
/* Design system overrides for dark/light mode using tokens */
.role-badge {
  background: var(--ps-card);
  border-color: var(--ps-border);
}
.role-badge--selected {
  border-color: var(--ps-primary);
  background: color-mix(in srgb, var(--ps-card) 85%, var(--ps-primary));
}
.role-badge--default {
  border-color: var(--ps-border);
  background: var(--ps-card);
}
.role-badge__title { color: var(--ps-text-primary); }
.role-badge__desc { color: var(--ps-text-secondary); }
</style>