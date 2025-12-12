<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="space-y-4">
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
    </div>

    <div v-if="!loading && generalError" class="text-red-600 text-sm">
      {{ generalError }}
    </div>

    <BaseButton
      type="submit"
      variant="primary"
      size="md"
      :loading="loading ?? authStore.isLoading"
      :disabled="!isFormValid"
      class="w-full"
    >
      Iniciar Sesión
    </BaseButton>

    <div class="text-center">
      <button
        type="button"
        @click="$emit('switchToRegister')"
        class="text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        ¿No tienes cuenta? Regístrate
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
  switchToRegister: []
}>()

// Props
const props = defineProps<{
  loading?: boolean
  generalError?: string
}>()
const loading = props.loading
const generalError = props.generalError

// Composables
const router = useRouter()
const authStore = useAuthStore()

// Form data
const form = ref({
  email: '',
  password: ''
})

// Form validation
const errors = ref({
  email: '',
  password: ''
})

const isFormValid = computed(() => {
  return form.value.email && 
         form.value.password && 
         !errors.value.email && 
         !errors.value.password
})

// Validation functions
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'El email es requerido'
  if (!emailRegex.test(email)) return 'El email no es válido'
  return ''
}

const validatePassword = (password: string) => {
  if (!password) return 'La contraseña es requerida'
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
  return ''
}

// Form submission
const handleSubmit = async () => {
  // Clear previous errors
  authStore.clearError()
  
  // Validate form
  errors.value.email = validateEmail(form.value.email)
  errors.value.password = validatePassword(form.value.password)

  if (!isFormValid.value) return

  // Submit form
  const result = await authStore.login({
    email: form.value.email,
    password: form.value.password
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
.login-form {
  @apply space-y-6;
}

.login-form__fields {
  @apply space-y-4;
}

.login-form__error {
  @apply p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm;
}

.login-form__actions {
  @apply pt-2;
}

.login-form__footer {
  @apply text-center;
}

.login-form__register-link {
  @apply text-sm text-gray-600;
}

.login-form__link {
  @apply text-blue-600 hover:text-blue-500 font-medium transition-colors;
}
</style>
