import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthView from '../views/AuthView.vue'
import Dashboard from '../views/Dashboard.vue'
import InventoryView from '../views/InventoryView.vue'
import SuppliersView from '../views/SuppliersView.vue'
import SupplierDetailView from '../views/SupplierDetailView.vue'
import SupplierNewView from '../views/SupplierNewView.vue'
import ProductNewView from '../views/ProductNewView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import ProductEditView from '../views/ProductEditView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import CategoryNewView from '../views/CategoryNewView.vue'
import CategoryEditView from '../views/CategoryEditView.vue'
import CustomersView from '../views/CustomersView.vue'
import CustomerNewView from '../views/CustomerNewView.vue'
import CustomerEditView from '../views/CustomerEditView.vue'
import CustomerDetailView from '../views/CustomerDetailView.vue'
import InvoicesView from '../views/InvoicesView.vue'
import InvoiceNewView from '../views/InvoiceNewView.vue'
import InvoiceEditView from '../views/InvoiceEditView.vue'
import InvoiceDetailView from '../views/InvoiceDetailView.vue'
import CompanyView from '../views/CompanyView.vue'
import PricingSettingsView from '../views/PricingSettingsView.vue'
import HelpView from '../views/HelpView.vue'
import SalesPOSView from '../views/SalesPOSView.vue'
import SalesNewView from '../views/SalesNewView.vue'

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
      path: '/company/pricing',
      component: PricingSettingsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/help',
      name: 'Help',
      component: HelpView,
      meta: { requiresAuth: true }
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
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/inventory',
      name: 'Inventory',
      component: InventoryView,
      meta: { requiresAuth: true }
    },
    // Alias para evitar pantalla en blanco si el usuario navega a /products
    {
      path: '/products',
      name: 'Products',
      redirect: '/inventory',
      meta: { requiresAuth: true }
    },
    {
      path: '/suppliers',
      name: 'Suppliers',
      component: SuppliersView,
      meta: { requiresAuth: true }
    },
    {
      path: '/suppliers/new',
      name: 'SupplierNew',
      component: SupplierNewView,
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
    },
    {
      path: '/products/:id/edit',
      name: 'ProductEdit',
      component: ProductEditView,
      meta: { requiresAuth: true }
    },
    {
      path: '/categories',
      name: 'Categories',
      component: CategoriesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/categories/new',
      name: 'CategoryNew',
      component: CategoryNewView,
      meta: { requiresAuth: true }
    },
    {
      path: '/categories/:id/edit',
      name: 'CategoryEdit',
      component: CategoryEditView,
      meta: { requiresAuth: true }
    },
    {
      path: '/customers',
      name: 'Customers',
      component: CustomersView,
      meta: { requiresAuth: true }
    },
    {
      path: '/customers/new',
      name: 'CustomerNew',
      component: CustomerNewView,
      meta: { requiresAuth: true }
    },
    {
      path: '/customers/:id',
      name: 'CustomerDetail',
      component: CustomerDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/customers/:id/edit',
      name: 'CustomerEdit',
      component: CustomerEditView,
      meta: { requiresAuth: true }
    },
    {
      path: '/invoices',
      name: 'Invoices',
      component: InvoicesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/invoices/new',
      name: 'InvoiceNew',
      component: InvoiceNewView,
      meta: { requiresAuth: true }
    },
    {
      path: '/invoices/:id',
      name: 'InvoiceDetail',
      component: InvoiceDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/invoices/:id/edit',
      name: 'InvoiceEdit',
      component: InvoiceEditView,
      meta: { requiresAuth: true }
    },
    {
      path: '/company',
      name: 'Company',
      component: CompanyView,
      meta: { requiresAuth: true }
    },
    {
      path: '/pos',
      name: 'SalesPOS',
      component: SalesPOSView,
      meta: { requiresAuth: true }
    }
    ,{
      path: '/sales/new',
      name: 'SalesNew',
      component: SalesNewView,
      meta: { requiresAuth: false }
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
