<template>
  <div class="flex items-center gap-1 select-none relative z-50">
    <!-- Minimizar -->
    <button
      type="button"
      aria-label="Minimizar"
      title="Minimizar"
      class="group h-6 w-10 flex items-center justify-center rounded-md transition-colors outline-none
             hover:bg-white/70 active:bg-white
             dark:hover:bg-white/30 dark:active:bg-white/40
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ps-primary)]"
      style="-webkit-app-region: no-drag; pointer-events: auto;"
      @mousedown.stop
      @dblclick.stop
      @click="onMinimize"
    >
      <span class="text-base leading-none transition-colors group-hover:text-black">—</span>
    </button>

    <!-- Maximizar/Restaurar -->
    <button
      type="button"
      aria-label="Maximizar/Restaurar"
      title="Maximizar/Restaurar"
      class="group h-6 w-10 flex items-center justify-center rounded-md transition-colors outline-none
             hover:bg-white/70 active:bg-white
             dark:hover:bg-white/30 dark:active:bg-white/40
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ps-primary)]"
      style="-webkit-app-region: no-drag; pointer-events: auto;"
      @mousedown.stop
      @dblclick.stop
      @click="onToggleMaximize"
    >
      <span class="text-sm leading-none transition-colors group-hover:text-black">▢</span>
    </button>

    <!-- Cerrar -->
    <button
      type="button"
      aria-label="Cerrar"
      title="Cerrar"
      class="group h-6 w-10 flex items-center justify-center rounded-md transition-colors outline-none
             hover:bg-red-600 active:bg-red-700
             dark:hover:bg-red-600 dark:active:bg-red-700
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ps-primary)]"
      style="-webkit-app-region: no-drag; pointer-events: auto;"
      @mousedown.stop
      @dblclick.stop
      @click="onClose"
    >
      <span class="text-base leading-none transition-colors group-hover:text-white">✕</span>
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