<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo y navegación principal -->
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <h1 class="text-xl font-bold text-gray-900">PryceSync ERP</h1>
          </div>
          
          <div class="hidden md:ml-6 md:flex md:space-x-8">
            <router-link
              to="/"
              class="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              :class="{ 'text-primary-600 border-b-2 border-primary-600': $route.name === 'home' }"
            >
              Inicio
            </router-link>
            
            <router-link
              to="/about"
              class="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              :class="{ 'text-primary-600 border-b-2 border-primary-600': $route.name === 'about' }"
            >
              Acerca de
            </router-link>
          </div>
        </div>

        <!-- Usuario y acciones -->
        <div class="flex items-center space-x-4">
          <div v-if="authStore.user" class="flex items-center space-x-3">
            <!-- Avatar del usuario -->
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-primary-600 text-sm font-medium">
                {{ userInitials }}
              </span>
            </div>
            
            <!-- Información del usuario -->
            <div class="hidden md:block">
              <p class="text-sm font-medium text-gray-900">{{ authStore.user.name }}</p>
              <p class="text-xs text-gray-500">{{ authStore.user.role }}</p>
            </div>
            
            <!-- Botón de logout -->
            <BaseButton
              variant="outline"
              size="small"
              @click="handleLogout"
              class="ml-3"
            >
              Cerrar Sesión
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import BaseButton from '../atoms/BaseButton.vue'

// Composables
const router = useRouter()
const authStore = useAuthStore()

// Computed
const userInitials = computed(() => {
  if (!authStore.user?.name) return ''
  return authStore.user.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Methods
const handleLogout = () => {
  authStore.logout()
  router.push('/auth')
}
</script>