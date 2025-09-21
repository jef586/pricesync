<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Mostrar navbar solo si el usuario está autenticado -->
    <AppNavbar v-if="authStore.isAuthenticated" />
    
    <!-- Contenido principal -->
    <main :class="authStore.isAuthenticated ? 'pt-0' : ''">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AppNavbar from './components/organisms/AppNavbar.vue'

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
}

#app {
  min-height: 100vh;
}
</style>
