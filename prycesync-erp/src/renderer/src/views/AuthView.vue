<template>
  <div class="auth-view">
    <div class="auth-view__container">
  <div class="auth-view__brand">
    <div class="auth-view__logo">
      <img :src="logoUrl" alt="IberaSoft" class="auth-view__logo-icon" />
      <span class="auth-view__logo-text">PryceSync ERP</span>
    </div>
    <p class="auth-view__tagline">
      Sistema integral de gestión empresarial
    </p>
  </div>

      <div class="auth-view__form">
        <AuthCard
          :initial-mode="mode"
          :loading="authStore.isLoading"
          :error="authStore.error"
          @login="handleLogin"
          @register="handleRegister"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthCard from '../components/organisms/AuthCard.vue'
import logoUrl from '@/assets/iberasoft-logo.png'

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
const authStore = useAuthStore()

const mode = computed(() => {
  return route.query.mode === 'register' ? 'register' : 'login'
})

const handleLogin = async (data: LoginData) => {
  const result = await authStore.login(data)
  
  if (result.success) {
    router.push('/')
  }
}

const handleRegister = async (data: RegisterData) => {
  const result = await authStore.register({
    ...data,
    role: 'admin',
    companyId: 'cmfzbx1ff0000521dfh4ynxm1'
  })
  
  if (result.success) {
    router.push('/')
  }
}

// Inicializar autenticación al montar el componente
onMounted(() => {
  authStore.initializeAuth()
})
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
  @apply w-16 h-16 object-contain;
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