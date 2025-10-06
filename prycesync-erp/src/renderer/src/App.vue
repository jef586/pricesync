<template>
  <div id="app" class="min-h-screen">
    <!-- Contenido principal (el navbar ahora vive dentro de DashboardLayout) -->
    <main :class="authStore.isAuthenticated ? 'pt-0' : ''">
      <RouterView />
    </main>
    
    <!-- Contenedor de notificaciones global -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import NotificationContainer from './components/molecules/NotificationContainer.vue'

// Composables
const authStore = useAuthStore()
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
  min-height: 100vh;
}
</style>
