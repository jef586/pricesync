<template>
  <BaseCard variant="elevated" class="auth-card">
    <template #header>
      <div class="auth-card__header">
        <h1 class="auth-card__title">
          {{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}
        </h1>
        <p class="auth-card__subtitle">
          {{ isLogin 
            ? 'Accede a tu cuenta' 
            : 'Crea tu cuenta' 
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
          Al continuar aceptas nuestros términos y políticas.
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
  @apply w-full max-w-md mx-auto rounded-2xl shadow-xl border p-8;
  animation: cardFloat 8s ease-in-out infinite;
}

.auth-card__header {
  @apply text-center mb-8;
}

.auth-card__title {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2;
  animation: titleFadeIn 400ms ease-out both;
}

.auth-card__subtitle {
  @apply text-gray-600 dark:text-gray-300 text-sm;
}

.auth-card__content {
  @apply py-2;
  animation: contentFadeIn 500ms 100ms ease-out both;
}

.auth-card__footer {
  @apply text-center mt-8 pt-6 border-t;
}

.auth-card__footer-text {
  @apply text-xs text-gray-500 dark:text-gray-400 leading-relaxed;
}

@keyframes cardFloat {
  0% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}

@keyframes titleFadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes contentFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
