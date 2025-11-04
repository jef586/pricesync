import './assets/main.css'
import { useTheme } from './composables/useTheme'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializar autenticación
const authStore = useAuthStore()
authStore.initializeAuth()

// Refrescar el usuario para asegurar que 'role' esté presente
if (authStore.token) {
  authStore.getCurrentUser().catch(() => {
    // Ignorar errores silenciosamente; el guard de router ya maneja 401
  })
}

// Inicializar tema visual (light/dark)
const { initTheme } = useTheme()
initTheme()

app.mount('#app')
