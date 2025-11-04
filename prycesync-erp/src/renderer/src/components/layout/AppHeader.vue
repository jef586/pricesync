<template>
  <header
    class="h-10 flex items-center justify-between px-3 select-none app-region-drag border-b border-default bg-[var(--ps-bg)] text-[var(--ps-text-primary)] fixed top-0 inset-x-0 z-[100]"
    role="banner"
  >
    <div class="flex items-center gap-2">
      <!-- Botón Volver Atrás -->
      <button
        type="button"
        aria-label="Volver"
        title="Volver"
        class="h-6 w-8 flex items-center justify-center rounded-md transition-colors outline-none
               hover:bg-black/5 active:bg-black/10
               dark:hover:bg-white/10 dark:active:bg-white/20
               focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ps-primary)]"
        style="-webkit-app-region: no-drag; pointer-events: auto;"
        @mousedown.stop
        @dblclick.stop
        @click="onBack"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- Icono de la aplicación en el header -->
      <img :src="logoUrl" alt="Aplicación" class="w-5 h-5 object-contain opacity-90" />

      <div class="font-semibold text-sm opacity-80 truncate">Punto de Venta 2026</div>
    </div>
    <WindowControls />
  </header>
</template>

<script setup lang="ts">
import WindowControls from './WindowControls.vue'
import { useRouter, useRoute } from 'vue-router'
import logoUrl from '@/assets/iberasoft-logo.png'
const props = defineProps<{ onToggleSidebar?: () => void }>()

const router = useRouter()
const route = useRoute()
const onBack = () => {
  try {
    const backTo = route.meta?.backTo as string | undefined
    if (backTo) {
      router.push(backTo)
      return
    }
    // Fallback robusto: si no hay historial suficiente o estamos en RolesMatrix, ir a Usuarios
    const historyLen = (window.history?.length ?? 0)
    if (historyLen <= 1 || route.name === 'RolesMatrix') {
      router.push({ name: 'Users' })
      return
    }
    router.back()
  } catch (e) {
    console.warn('[Header] No se pudo volver atrás:', e)
  }
}
</script>

<style scoped>
/* Área arrastrable para el header */
.app-region-drag { -webkit-app-region: drag; }
</style>