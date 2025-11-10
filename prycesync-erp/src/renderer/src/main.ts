import './assets/main.css'
import { useTheme } from './composables/useTheme'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { usePrintingStore } from './stores/printing'

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

// Atajo global: F9 abre Consulta de Precios
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'F9') {
    e.preventDefault()
    router.push('/articles/price-lookup')
  }
})

// Silent retry of pending print jobs shortly after startup
setTimeout(async () => {
  try {
    const printing = usePrintingStore()
    printing.loadFromLocalStorage()
    const pending = printing.pendingJobs()
    if (pending > 0) {
      await printing.retryPrintQueueAll()
    }
  } catch (_) {
    // ignore
  }
}, 1200)

app.mount('#app')
