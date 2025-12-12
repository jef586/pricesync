<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="space-y-4">
      <BaseInput
        v-model="form.name"
        type="text"
        label="Nombre completo"
        placeholder="Tu nombre"
        :has-error="!!errors.name"
        :error-message="errors.name"
        required
      />
      
      <BaseInput
        v-model="form.email"
        type="email"
        label="Email"
        placeholder="tu@email.com"
        :has-error="!!errors.email"
        :error-message="errors.email"
        required
      />
      
      <BaseInput
        v-model="form.password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        :has-error="!!errors.password"
        :error-message="errors.password"
        required
      />
      
      <BaseInput
        v-model="form.confirmPassword"
        type="password"
        label="Confirmar contraseña"
        placeholder="••••••••"
        :has-error="!!errors.confirmPassword"
        :error-message="errors.confirmPassword"
        required
      />
    </div>

    <div v-if="authStore.error" class="text-red-600 text-sm">
      {{ authStore.error }}
    </div>

    <BaseButton
      type="submit"
      variant="primary"
      size="large"
      :loading="authStore.isLoading"
      :disabled="!isFormValid"
      class="w-full"
    >
      Crear Cuenta
    </BaseButton>

    <div class="text-center">
      <button
        type="button"
        @click="$emit('switchToLogin')"
        class="text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        ¿Ya tienes cuenta? Inicia sesión
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '../atoms/BaseInput.vue'
import BaseButton from '../atoms/BaseButton.vue'
import { useAuthStore } from '../../stores/auth'

// Emits
defineEmits<{
  switchToLogin: []
}>()

// Composables
const router = useRouter()
const authStore = useAuthStore()

// Form data
const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Form validation
const errors = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isFormValid = computed(() => {
  return form.value.name && 
         form.value.email && 
         form.value.password && 
         form.value.confirmPassword &&
         !errors.value.name && 
         !errors.value.email && 
         !errors.value.password && 
         !errors.value.confirmPassword
})

// Validation functions
const validateName = (name: string) => {
  if (!name) return 'El nombre es requerido'
  if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres'
  return ''
}

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'El email es requerido'
  if (!emailRegex.test(email)) return 'El email no es válido'
  return ''
}

const validatePassword = (password: string) => {
  if (!password) return 'La contraseña es requerida'
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  return ''
}

const validateConfirmPassword = (confirmPassword: string, password: string) => {
  if (!confirmPassword) return 'Confirma tu contraseña'
  if (confirmPassword !== password) return 'Las contraseñas no coinciden'
  return ''
}

// Form submission
const handleSubmit = async () => {
  // Clear previous errors
  authStore.clearError()
  
  // Validate form
  errors.value.name = validateName(form.value.name)
  errors.value.email = validateEmail(form.value.email)
  errors.value.password = validatePassword(form.value.password)
  errors.value.confirmPassword = validateConfirmPassword(form.value.confirmPassword, form.value.password)

  if (!isFormValid.value) return

  // Submit form
  const result = await authStore.register({
    name: form.value.name,
    email: form.value.email,
    password: form.value.password,
    role: 'admin', // Por defecto admin para el primer usuario
    companyId: ((import.meta as any).env?.VITE_COMPANY_ID || (import.meta as any).env?.COMPANY_ID || 'cmfzbx1ff0000521dfh4ynxm1')
  })

  if (result.success) {
    router.push('/')
  }
}

// Clear errors on mount
onMounted(() => {
  authStore.clearError()
})
</script>

<style scoped>
.register-form {
  @apply space-y-6;
}

.register-form__fields {
  @apply space-y-4;
}

.register-form__error {
  @apply p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm;
}

.register-form__actions {
  @apply pt-2;
}

.register-form__footer {
  @apply text-center;
}

.register-form__login-link {
  @apply text-sm text-gray-600;
}

.register-form__link {
  @apply text-blue-600 hover:text-blue-500 font-medium transition-colors;
}
</style>
