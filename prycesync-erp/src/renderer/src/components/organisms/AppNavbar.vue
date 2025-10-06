<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo y título a la izquierda -->
      <div class="navbar-brand">
        <!-- <img :src="logoUrl" alt="IberaSoft" class="brand-logo-img" />
        <div class="brand-text">PryceSync ERP</div> -->
      </div>

      <!-- Buscador global centrado -->
      <div class="navbar-search">
        <SearchBar 
          placeholder="Buscar facturas, clientes, productos..."
          @search="handleSearch"
          @select="handleSearchSelect"
        />
      </div>

      <!-- Información del usuario a la derecha -->
  <div class="navbar-user">
    <div class="company-info">
      <div class="company-name">{{ companyName }}</div>
      <div class="company-subtitle">Sistema de Facturación</div>
    </div>

    <div class="user-section">
      <ThemeSwitcher />
      <UserAvatar 
        :name="user?.name || 'Usuario'"
        :role="user?.role || 'user'"
        size="sm"
      />
          <UserDropdown 
            :user="user"
            @logout="handleLogout"
          />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import UserAvatar from '@/components/atoms/UserAvatar.vue'
import UserDropdown from '@/components/atoms/UserDropdown.vue'
import SearchBar from '@/components/atoms/SearchBar.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import logoUrl from '@/assets/iberasoft-logo.png'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.user)
const companyName = computed(() => user.value?.company?.name || 'PryceSync ERP')

const handleLogout = async () => {
  await authStore.logout()
  router.push('/auth')
}

const handleSearch = (query: string) => {
  console.log('Búsqueda:', query)
  // Aquí se implementaría la lógica de búsqueda global
}

const handleSearchSelect = (result: any) => {
  console.log('Resultado seleccionado:', result)
  // La navegación se maneja automáticamente en el componente SearchBar
}
</script>

<style scoped>
.navbar {
  @apply sticky top-0 z-40 w-full border-b border-gray-200;
  @apply backdrop-blur-sm;
  background: var(--ps-card);
}

.navbar-container {
  @apply w-full px-4 sm:px-6 lg:px-8;
  @apply flex items-center justify-between h-16;
  @apply gap-4;
}

.navbar-brand {
  @apply flex items-center gap-3 flex-shrink-0;
}

.brand-logo-img {
  @apply w-8 h-8 object-contain;
}

.brand-text {
  @apply text-xl font-bold;
  color: var(--ps-text-primary);
}

.navbar-search {
  @apply flex-1 max-w-2xl;
}

.navbar-user {
  @apply flex items-center gap-4 flex-shrink-0;
}

.company-info {
  @apply hidden md:block text-right;
}

.company-name {
  @apply text-sm font-medium;
  color: var(--ps-text-primary);
}

.company-subtitle {
  @apply text-xs;
  color: var(--ps-text-secondary);
}

.user-section {
  @apply flex items-center gap-3;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .navbar-container {
    @apply px-4 gap-2;
  }
  
  .navbar-search {
    @apply max-w-sm;
  }
  
  .company-info {
    @apply hidden;
  }
}

@media (max-width: 640px) {
  .navbar-container {
    @apply px-2 gap-2;
  }
  
  .navbar-search {
    @apply max-w-xs;
  }
  
  .brand-text {
    @apply hidden;
  }
}
</style>