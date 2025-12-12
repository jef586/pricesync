<template>
  <div class="auth-view">
    <div class="auth-view__container">
      <div class="auth-view__brand hidden lg:flex">
        <div class="auth-view__logo">
          <img :src="logoUrl" alt="Punto de Venta 2026" class="auth-view__logo-icon" />
        </div>
        <p class="auth-view__tagline">
          Sistema de punto de venta para tu negocio
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
import logoUrl from '@/assets/punto_de_venta_2026_optimized.png'

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
    try { (window as any).windowControls?.maximize?.() } catch {}
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
    try { (window as any).windowControls?.maximize?.() } catch {}
  }
}

// Inicializar autenticación al montar el componente
onMounted(() => {
  authStore.initializeAuth()
})

onMounted(() => {
  const gsap = (window as any).gsap
  if (!gsap) return
  const containerEl = document.querySelector('.auth-view__container')
  const brandEl = document.querySelector('.auth-view__brand')
  const formEl = document.querySelector('.auth-view__form')
  const taglineEl = document.querySelector('.auth-view__tagline')
  if (!formEl) return

  gsap.set(formEl, { opacity: 0, x: 48 })
  if (brandEl && containerEl) {
    const brandRect = brandEl.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    const brandCenterX = brandRect.left + brandRect.width / 2
    const containerCenterX = containerRect.left + containerRect.width / 2
    const offsetX = containerCenterX - brandCenterX
    gsap.set(brandEl, { opacity: 0, x: offsetX })
  }
  if (taglineEl) {
    gsap.set(taglineEl, { opacity: 0 })
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  if (brandEl) {
    tl.to(brandEl, { opacity: 1, duration: 1.0 })
      .to(brandEl, { x: 0, duration: 1.4, ease: 'expo.inOut' })
      .to(formEl, { opacity: 1, x: 0, duration: 1.0 }, '-=0.3')
    if (taglineEl) {
      tl.to(taglineEl, { opacity: 1, duration: 0.5, ease: 'power1.out' }, '+=0.1')
    }
  } else {
    tl.to(formEl, { opacity: 1, x: 0, duration: 1.0 })
    if (taglineEl) {
      tl.to(taglineEl, { opacity: 1, duration: 0.5, ease: 'power1.out' }, '+=0.1')
    }
  }
})
</script>

<style scoped>
.auth-view {
  @apply min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6;
}

.auth-view__container {
  @apply w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center;
}
.auth-view__brand {
  @apply h-full flex flex-col items-center justify-center text-center space-y-2;
}
.auth-view__container.is-intro .auth-view__brand {
  /* eliminado modo intro */
}
.auth-view__container.is-intro .auth-view__form {
  /* eliminado modo intro */
}

.auth-view__logo {
  @apply flex items-center justify-center space-x-4;
}

.auth-view__logo-icon {
  @apply w-96 h-96 object-contain drop-shadow-xl;
}

.auth-view__logo-text {
  @apply text-4xl font-bold text-gray-900 dark:text-gray-100;
}

.auth-view__tagline {
  @apply text-lg text-gray-600 dark:text-gray-300 whitespace-nowrap max-w-none mx-auto lg:mx-0 leading-tight mt-1;
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
    @apply w-80 h-80;
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
