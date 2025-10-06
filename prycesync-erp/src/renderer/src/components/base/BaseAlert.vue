<template>
  <div class="ps-alert" :class="alertClass">
    <div class="ps-alert__icon">
      <slot name="icon">
        <svg v-if="type==='warning'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L22 20H2L12 2Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8V12" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
        <svg v-else-if="type==='info'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="8" r="1" fill="currentColor"/>
          <path d="M12 11V16" stroke="currentColor" stroke-width="2"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 7V13" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="17" r="1" fill="currentColor"/>
        </svg>
      </slot>
    </div>
    <div class="flex-1">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ type: { type: String, default: 'info' } })
const alertClass = computed(() => (
  props.type === 'warning' ? 'ps-alert--warning' : props.type === 'danger' ? 'ps-alert--danger' : 'ps-alert--info'
))
</script>