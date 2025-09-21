<template>
  <div class="auth-view">
    <div class="auth-view__container">
      <div class="auth-view__brand">
        <div class="auth-view__logo">
          <svg class="auth-view__logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          </svg>
          <span class="auth-view__logo-text">PryceSync ERP</span>
        </div>
        <p class="auth-view__tagline">
          Sistema integral de gestión empresarial
        </p>
      </div>

      <div class="auth-view__form">
        <AuthCard
          :initial-mode="mode"
          :loading="loading"
          :error="error"
          @login="handleLogin"
          @register="handleRegister"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthCard from '../components/organisms/AuthCard.vue'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')

const mode = computed(() => {
  return route.query.mode === 'register' ? 'register' : 'login'
})

const handleLogin = async (data: LoginData) => {
  loading.value = true
  error.value = ''
  
  try {
    // TODO: Implementar llamada al store de autenticación
    console.log('Login data:', data)
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // TODO: Redirigir al dashboard después del login exitoso
    router.push('/')
  } catch (err) {
    error.value = 'Error al iniciar sesión. Verifica tus credenciales.'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

const handleRegister = async (data: RegisterData) => {
  loading.value = true
  error.value = ''
  
  try {
    // TODO: Implementar llamada al store de autenticación
    console.log('Register data:', data)
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // TODO: Redirigir al dashboard después del registro exitoso
    router.push('/')
  } catch (err) {
    error.value = 'Error al crear la cuenta. Inténtalo de nuevo.'
    console.error('Register error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  @apply min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6;
}

.auth-view__container {
  @apply w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center;
}

.auth-view__brand {
  @apply text-center lg:text-left space-y-8 lg:pr-8;
}

.auth-view__logo {
  @apply flex items-center justify-center lg:justify-start space-x-4;
}

.auth-view__logo-icon {
  @apply w-16 h-16 text-blue-600;
}

.auth-view__logo-text {
  @apply text-4xl font-bold text-gray-900;
}

.auth-view__tagline {
  @apply text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed;
}

.auth-view__form {
  @apply flex justify-center lg:justify-start;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .auth-view__container {
    @apply max-w-md gap-8;
  }
  
  .auth-view__brand {
    @apply text-center pr-0 space-y-6;
  }
  
  .auth-view__logo {
    @apply justify-center;
  }
  
  .auth-view__logo-icon {
    @apply w-12 h-12;
  }
  
  .auth-view__logo-text {
    @apply text-3xl;
  }
  
  .auth-view__tagline {
    @apply mx-auto text-base;
  }
  
  .auth-view__form {
    @apply justify-center;
  }
}

@media (max-width: 640px) {
  .auth-view {
    @apply p-4;
  }
  
  .auth-view__brand {
    @apply space-y-4;
  }
  
  .auth-view__logo-text {
    @apply text-2xl;
  }
  
  .auth-view__tagline {
    @apply text-sm;
  }
}
</style>