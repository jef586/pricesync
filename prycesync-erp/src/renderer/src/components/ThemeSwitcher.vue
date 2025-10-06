<template>
  <button
    class="ps-btn ps-btn--secondary dark:hover:bg-slate-700 flex items-center gap-2"
    :aria-label="theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'"
    @click="toggleTheme"
  >
    <span class="inline-block w-5 h-5">
      <svg v-if="theme === 'dark'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="currentColor" stroke-width="2" fill="currentColor"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="currentColor" />
        <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
        <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="currentColor" stroke-width="2"/>
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="currentColor" stroke-width="2"/>
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/>
      </svg>
    </span>
    <span class="text-sm text-secondary">{{ theme === 'dark' ? 'Oscuro' : 'Claro' }}</span>
  </button>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme'
const { theme, toggleTheme } = useTheme()
</script>

<style scoped>
button { height: 36px; }
</style>