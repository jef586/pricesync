<template>
  <BaseCard variant="elevated" class="auth-card">
    <template #header>
      <div class="auth-card__header">
        <h1 class="auth-card__title">
          {{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}
        </h1>
        <p class="auth-card__subtitle">
          {{ isLogin 
            ? 'Accede a tu cuenta de PryceSync ERP' 
            : 'Únete a PryceSync ERP' 
          }}
        </p>
      </div>
    </template>

    <div class="auth-card__content">
      <LoginForm
        v-if="isLogin"
        :loading="loading"
        :general-error="error"
        @submit="handleLogin"
        @switch-to-register="switchToRegister"
      />
      
      <RegisterForm
        v-else
        :loading="loading"
        :general-error="error"
        @submit="handleRegister"
        @switch-to-login="switchToLogin"
      />
    </div>

    <template #footer>
      <div class="auth-card__footer">
        <p class="auth-card__footer-text">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad.
        </p>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseCard from '../atoms/BaseCard.vue'
import LoginForm from '../molecules/LoginForm.vue'
import RegisterForm from '../molecules/RegisterForm.vue'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
}

interface Props {
  initialMode?: 'login' | 'register'
  loading?: boolean
  error?: string
}

interface Emits {
  (e: 'login', data: LoginData): void
  (e: 'register', data: RegisterData): void
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'login',
  loading: false,
  error: ''
})

const emit = defineEmits<Emits>()

const isLogin = ref(props.initialMode === 'login')

const switchToLogin = () => {
  isLogin.value = true
}

const switchToRegister = () => {
  isLogin.value = false
}

const handleLogin = (data: LoginData) => {
  emit('login', data)
}

const handleRegister = (data: RegisterData) => {
  emit('register', data)
}
</script>

<style scoped>
.auth-card {
  @apply w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8;
}

.auth-card__header {
  @apply text-center mb-8;
}

.auth-card__title {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

.auth-card__subtitle {
  @apply text-gray-600 text-sm;
}

.auth-card__content {
  @apply py-2;
}

.auth-card__footer {
  @apply text-center mt-8 pt-6 border-t border-gray-100;
}

.auth-card__footer-text {
  @apply text-xs text-gray-500 leading-relaxed;
}
</style>