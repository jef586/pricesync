<template>
  <div id="app" class="min-h-screen">
    <!-- Contenido principal (el navbar ahora vive dentro de DashboardLayout) -->
    <main :class="authStore.isAuthenticated ? 'pt-0' : ''">
      <RouterView :key="$route.fullPath" />
    </main>
    
    <!-- Contenedor de notificaciones global -->
    <NotificationContainer />
  </div>
  </template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import NotificationContainer from './components/molecules/NotificationContainer.vue'
import { onMounted } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import { usePrintingStore } from '@/stores/printing'

// Composables
const authStore = useAuthStore()
const { success } = useNotifications()
const printingStore = usePrintingStore()

onMounted(() => {
  // Initialize printing store (pending count and event listeners)
  try { printingStore.init() } catch (_) {}
  // Listen to print success events from main-process
  const sys: any = (window as any).system
  if (sys && sys.printQueue && typeof sys.printQueue.onPrintSuccess === 'function') {
    try {
      sys.printQueue.onPrintSuccess((_data: any) => {
        success('Ticket impreso correctamente')
      })
    } catch (_) {}
  }
})
</script>

<style>
/* Reset de estilos globales */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--ps-bg);
  color: var(--ps-text-primary);
}

#app {
  height: 100vh;
  overflow: hidden; /* Evita scroll global; el contenido interno maneja su propio scroll */
}

/* Variables globales */
:root {
  /* Altura del header fijo usada para posicionar los toasts */
  --ps-header-height: 40px;
}
</style>