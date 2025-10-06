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

// Inicializar tema visual (light/dark)
const { initTheme } = useTheme()
initTheme()

app.mount('#app')
