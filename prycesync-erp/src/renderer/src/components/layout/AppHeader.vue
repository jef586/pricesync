<template>
  <header
    class="h-10 flex items-center justify-between px-3 select-none app-region-drag border-b border-default bg-[var(--ps-bg)] text-[var(--ps-text-primary)] fixed top-0 inset-x-0 z-[100]"
    role="banner"
  >
    <div class="font-semibold text-sm opacity-80 truncate">PryceSync ERP</div>
    <WindowControls />
  </header>
</template>

<script setup lang="ts">
import WindowControls from './WindowControls.vue'
</script>

<style scoped>
/* Área arrastrable para el header */
.app-region-drag { -webkit-app-region: drag; }
</style>