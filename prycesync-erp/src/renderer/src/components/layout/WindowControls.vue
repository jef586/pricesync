<template>
  <div class="flex items-center gap-1 select-none relative z-50">
    <!-- Minimizar -->
    <button
      type="button"
      aria-label="Minimizar"
      title="Minimizar"
      class="h-6 w-10 flex items-center justify-center rounded-md transition-colors outline-none
             hover:bg-black/5 active:bg-black/10
             dark:hover:bg-white/10 dark:active:bg-white/20
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ps-primary)]"
      style="-webkit-app-region: no-drag; pointer-events: auto;"
      @mousedown.stop
      @dblclick.stop
      @click="onMinimize"
    >
      <span class="text-base leading-none">—</span>
    </button>

    <!-- Maximizar/Restaurar -->
    <button
      type="button"
      aria-label="Maximizar/Restaurar"
      title="Maximizar/Restaurar"
      class="h-6 w-10 flex items-center justify-center rounded-md transition-colors outline-none
             hover:bg-black/5 active:bg-black/10
             dark:hover:bg-white/10 dark:active:bg-white/20
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ps-primary)]"
      style="-webkit-app-region: no-drag; pointer-events: auto;"
      @mousedown.stop
      @dblclick.stop
      @click="onToggleMaximize"
    >
      <span class="text-sm leading-none">▢</span>
    </button>

    <!-- Cerrar -->
    <button
      type="button"
      aria-label="Cerrar"
      title="Cerrar"
      class="h-6 w-10 flex items-center justify-center rounded-md transition-colors outline-none
             hover:bg-black/5 active:bg-black/10
             dark:hover:bg-white/10 dark:active:bg-white/20
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ps-primary)]"
      style="-webkit-app-region: no-drag; pointer-events: auto;"
      @mousedown.stop
      @dblclick.stop
      @click="onClose"
    >
      <span class="text-base leading-none">✕</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const onMinimize = () => {
  console.log('[UI] minimize click, windowControls:', window.windowControls)
  window.windowControls?.minimize?.()
}
const onToggleMaximize = () => {
  console.log('[UI] toggleMaximize click, windowControls:', window.windowControls)
  window.windowControls?.toggleMaximize?.()
}
const onClose = () => {
  console.log('[UI] close click, windowControls:', window.windowControls)
  window.windowControls?.close?.()
}
</script>