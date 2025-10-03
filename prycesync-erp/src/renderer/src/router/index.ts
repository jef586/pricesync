import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthView from '../views/AuthView.vue'
import DashboardView from '../views/DashboardView.vue'
import InventoryView from '../views/InventoryView.vue'
import SuppliersView from '../views/SuppliersView.vue'
import SupplierDetailView from '../views/SupplierDetailView.vue'
import ProductNewView from '../views/ProductNewView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: AuthView,
      meta: { requiresAuth: false }
    },
    {
      path: '/auth',
      name: 'Auth',
      component: AuthView,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/inventory',
      name: 'Inventory',
      component: InventoryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/suppliers',
      name: 'Suppliers',
      component: SuppliersView,
      meta: { requiresAuth: true }
    },
    {
      path: '/suppliers/:id',
      name: 'SupplierDetail',
      component: SupplierDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/products/new',
      name: 'ProductNew',
      component: ProductNewView,
      meta: { requiresAuth: true }
    },
    {
      path: '/products/:id',
      name: 'ProductDetail',
      component: ProductDetailView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  console.log('🛣️ Router guard:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest,
    isAuthenticated: authStore.isAuthenticated
  })
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('🚫 Redirecting to /auth - not authenticated')
    next('/auth')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('🚫 Redirecting to / - already authenticated')
    next('/')
  } else {
    console.log('✅ Navigation allowed')
    next()
  }
})

export default router
