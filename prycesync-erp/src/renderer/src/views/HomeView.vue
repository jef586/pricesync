<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import TheWelcome from '../components/TheWelcome.vue'

const authStore = useAuthStore()

// Inicializar autenticación al montar el componente
onMounted(() => {
  authStore.initializeAuth()
})
</script>

<template>
  <main>
    <div v-if="authStore.isAuthenticated" class="home-authenticated">
      <div class="welcome-header">
        <h1>Bienvenido, {{ authStore.user?.name }}!</h1>
        <p>{{ authStore.user?.company?.name }}</p>
        <button @click="authStore.logout()" class="logout-btn">
          Cerrar Sesión
        </button>
      </div>
      <TheWelcome />
    </div>
    <div v-else class="home-loading">
      <p>Cargando...</p>
    </div>
  </main>
</template>

<style scoped>
.home-authenticated {
  padding: 2rem;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.welcome-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.welcome-header p {
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.logout-btn {
  background-color: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #dc2626;
}

.home-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: #6b7280;
}
</style>
