<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="dashboard-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <button @click="toggleSidebar" class="sidebar-toggle">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }" :title="sidebarCollapsed ? 'Dashboard' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Dashboard' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Dashboard</span>
            </router-link>
          </li>
          
           <li class="nav-item">
            <router-link to="/articles" class="nav-link" :class="{ active: $route.path.startsWith('/articles') }" :title="sidebarCollapsed ? 'Artículos' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Artículos' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5V4.5C4 3.67157 4.67157 3 5.5 3H14.5C15.3284 3 16 3.67157 16 4.5V19.5C16 20.3284 15.3284 21 14.5 21H5.5C4.67157 21 4 20.3284 4 19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 7H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 11H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 15H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Artículos</span>
            </router-link>
          </li>



          <li class="nav-item">
            <router-link to="/invoices" class="nav-link" :class="{ active: $route.path.startsWith('/invoices') }" :title="sidebarCollapsed ? 'Facturas' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Facturas' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Facturas</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link to="/pos" class="nav-link" :class="{ active: $route.path.startsWith('/pos') }" :title="sidebarCollapsed ? 'Ventas' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Ventas' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H21V7H3V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5 7L7 21H17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 11H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Ventas</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link to="/customers" class="nav-link" :class="{ active: $route.path.startsWith('/customers') }" :title="sidebarCollapsed ? 'Clientes' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Clientes' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Clientes</span>
            </router-link>
          </li>
         

          <li class="nav-item">
            <router-link to="/suppliers" class="nav-link" :class="{ active: $route.path.startsWith('/suppliers') }" :title="sidebarCollapsed ? 'Proveedores' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Proveedores' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Proveedores</span>
            </router-link>
          </li>

         
          <li class="nav-item">
            <router-link to="/rubros" class="nav-link" :class="{ active: $route.path.startsWith('/rubros') }" :title="sidebarCollapsed ? 'Rubros' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Categorías' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 7H17V17H7V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 3H21V21H3V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 3L21 8L16 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 21L3 16L8 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Rubros</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link to="/company" class="nav-link" :class="{ active: $route.path.startsWith('/company') }" :title="sidebarCollapsed ? 'Empresa' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Empresa' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21V5C19 4.46957 18.7893 3.96086 18.4142 3.58579C18.0391 3.21071 17.5304 3 17 3H7C6.46957 3 5.96086 3.21071 5.58579 3.58579C5.21071 3.96086 5 4.46957 5 5V21L12 17L19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Empresa</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link to="/help" class="nav-link" :class="{ active: $route.path.startsWith('/help') }" :title="sidebarCollapsed ? 'Ayuda' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Ayuda' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.09 9A3 3 0 0 1 15 10C15 12 12 12.5 12 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="18" r="1" fill="currentColor" />
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Ayuda</span>
            </router-link>
          </li>

          <!-- Usuarios (visible sólo con permiso admin:users) -->
          <li class="nav-item" v-if="authStore.hasPermission('admin:users')">
            <router-link to="/admin/config/users" class="nav-link" :class="{ active: $route.path.startsWith('/admin/config/users') }" :title="sidebarCollapsed ? 'Usuarios' : ''">
              <svg class="nav-icon" :title="sidebarCollapsed ? 'Usuarios' : ''" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-if="!sidebarCollapsed" class="nav-text">Usuarios</span>
            </router-link>
          </li>

          

        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" :class="{ collapsed: sidebarCollapsed }">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <div v-if="!sidebarCollapsed" class="user-details">
            <div class="user-name">{{ authStore.user?.name }}</div>
            <div class="user-role">{{ authStore.user?.role }}</div>
          </div>
        </div>
        <!-- Botón claro/oscuro, ubicado debajo del bloque de usuario -->
        <div class="theme-switcher-container" :class="{ centered: sidebarCollapsed }">
          <ThemeSwitcher :showLabel="!sidebarCollapsed" />
        </div>
        <button @click="handleLogout" class="logout-button" :title="sidebarCollapsed ? 'Cerrar Sesión' : ''">
          <svg class="logout-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-if="!sidebarCollapsed" class="logout-text">Salir</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="dashboard-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Header de la aplicación con área draggable -->
      <AppHeader :onToggleSidebar="toggleSidebar" />
      <div class="dashboard-content" :key="$route.fullPath">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import logoUrl from '@/assets/iberasoft-logo.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarCollapsed = ref(true)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  background-color: var(--ps-bg);
}

/* Sidebar Styles */
.dashboard-sidebar {
  width: 280px;
  background: var(--ps-sidebar);
  color: var(--ps-text-primary);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  z-index: 10;
  /* Empuja el sidebar por debajo del header fijo (h-10 ~ 40px) */
  margin-top: 40px;
}

.dashboard-sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--ps-border);
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* Logo eliminado: mantenemos solo el botón hamburguesa */

.sidebar-toggle {
  background: none;
  border: none;
  color: var(--ps-text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.sidebar-toggle:hover {
  background-color: rgba(0,0,0,0.06);
}

.sidebar-toggle svg {
  width: 20px;
  height: 20px;
}

/* Navigation Styles */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: var(--ps-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  border-right: 3px solid transparent;
}

.nav-link:hover {
  background-color: rgba(0,0,0,0.06);
  color: var(--ps-text-primary);
}

.nav-link.active {
  background-color: var(--ps-primary);
  color: white;
  border-right-color: var(--ps-primary);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  font-weight: 500;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--ps-border);
}

.theme-switcher-container {
  margin: 0.5rem 0 0.75rem 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: var(--ps-card);
  border-radius: 0.5rem;
}

.user-info.collapsed {
  justify-content: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--ps-text-primary);
  truncate: true;
}

.user-role {
  font-size: 0.75rem;
  color: var(--ps-text-secondary);
  text-transform: capitalize;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  color: #f87171;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.logout-button:hover {
  background-color: #7f1d1d;
  color: #fca5a5;
}

.logout-icon {
  width: 18px;
  height: 18px;
}

/* Main Content Styles */
.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  /* Compensar el header fijo (h-10 ~ 40px) */
  padding-top: 40px;
  /* Permite que el contenido interno haga scroll */
  min-height: 0;
}

.dashboard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* Reducimos padding inferior para que las columnas lleguen más abajo */
  padding: 2rem 2rem 0.75rem 2rem;
  overflow-y: auto; /* Scroll solo cuando se necesite */
  overscroll-behavior: contain;
  min-height: 0;
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: var(--ps-border) transparent;
}

/* Estilo de scrollbar (WebKit) dentro del área de contenido */
:deep(.dashboard-content::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

:deep(.dashboard-content::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.dashboard-content::-webkit-scrollbar-thumb) {
  background-color: color-mix(in srgb, var(--ps-border) 70%, transparent);
  border-radius: 8px;
  border: 2px solid var(--ps-bg);
}

:deep(.dashboard-content::-webkit-scrollbar-thumb:hover) {
  background-color: color-mix(in srgb, var(--ps-primary) 50%, var(--ps-border) 50%);
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-sidebar {
    position: fixed;
    left: 0;
    /* En móviles, dejar espacio para el header fijo */
    top: 40px;
    height: 100vh;
    z-index: 50;
    transform: translateX(-100%);
  }

  .dashboard-sidebar:not(.collapsed) {
    transform: translateX(0);
  }

  .dashboard-main {
    margin-left: 0;
  }

  .dashboard-content {
    padding: 1rem;
  }
}
</style>
