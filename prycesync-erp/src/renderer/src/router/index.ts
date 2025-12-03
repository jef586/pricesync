import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthView from '../views/AuthView.vue'
import Dashboard from '../views/Dashboard.vue'
import HomeView from '../views/HomeView.vue'
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
import PrintingSettingsView from '../views/PrintingSettingsView.vue'
import HelpView from '../views/HelpView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import SalesPOSView from '../views/SalesPOSView.vue'
import SalesNewView from '../views/SalesNewView.vue'
import ParkedSalesView from '../views/ParkedSalesView.vue'
import ArticlesView from '../views/ArticlesView.vue'
import ArticleNewView from '../views/ArticleNewView.vue'
import ArticleEditView from '../views/ArticleEditView.vue'
import PriceLookupView from '../views/PriceLookupView.vue'
import AIChatView from '../views/AIChatView.vue'
import UsersView from '../views/UsersView.vue'
import UserEditView from '../views/UserEditView.vue'
import RolesMatrixView from '../views/RolesMatrixView.vue'
import RolesMatrixEditor from '../views/RolesMatrixEditor.vue'
import AuditLogsView from '../views/AuditLogsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'Home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/config/audit',
      name: 'AuditLogs',
      component: AuditLogsView,
      meta: { requiresAuth: true, permissions: 'admin:audit' }
    },
    {
      path: '/admin/config/users/audit',
      name: 'AuditLogsUsers',
      component: AuditLogsView,
      meta: { requiresAuth: true, permissions: 'admin:audit', backTo: '/admin/config/users' }
    },
    {
      path: '/admin/config/users',
      name: 'Users',
      component: UsersView,
      meta: { requiresAuth: true, requiresScope: 'admin:users' }
    },
    {
      path: '/admin/config/users/roles',
      name: 'RolesMatrix',
      component: RolesMatrixView,
      meta: { requiresAuth: true, requiresScope: 'admin:users', backTo: '/admin/config/users' }
    },
    {
      path: '/admin/config/roles',
      name: 'RolesMatrixEditor',
      component: RolesMatrixEditor,
      meta: { requiresAuth: true, requiresScope: 'admin:roles' }
    },
    {
      path: '/admin/config/users/:id',
      name: 'UserEdit',
      component: UserEditView,
      meta: { requiresAuth: true, requiresScope: 'admin:users' }
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
      path: '/company/settings/printing',
      name: 'CompanyPrintingSettings',
      component: PrintingSettingsView,
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
      path: '/403',
      name: 'Forbidden',
      component: ForbiddenView,
      meta: { requiresAuth: true }
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
    },
    {
      path: '/pos/parked',
      name: 'ParkedSales',
      component: ParkedSalesView,
      meta: { requiresAuth: true }
    }
    ,{
      path: '/sales/new',
      name: 'SalesNew',
      component: SalesNewView,
      meta: { requiresAuth: false }
    },
    {
      path: '/articles',
      name: 'Articles',
      component: ArticlesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/articles/price-lookup',
      name: 'PriceLookup',
      component: PriceLookupView,
      meta: { requiresAuth: true, requiresScope: 'article:read' }
    },
    {
      path: '/articles/new',
      name: 'ArticleNew',
      component: ArticleNewView,
      meta: { requiresAuth: true }
    },
    {
      path: '/articles/:id/edit',
      name: 'ArticleEdit',
      component: ArticleEditView,
      meta: { requiresAuth: true }
    },
    {
      path: '/ai-chat',
      name: 'AIChat',
      component: AIChatView,
      meta: { requiresAuth: true }
    },
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  console.log('🛣️ Router guard:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest,
    requiresScope: (to.meta as any).requiresScope,
    permissions: (to.meta as any).permissions,
    isAuthenticated: authStore.isAuthenticated
  })
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('🚫 Redirecting to /login - not authenticated')
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('🚫 Redirecting to / - already authenticated')
    next('/')
  } else {
    // Validación de companyId para rutas bajo /admin/config/*
    const isAdminConfig = to.path.startsWith('/admin/config')
    const role = String(authStore.userRole || '').toUpperCase()
    const hasCompany = !!authStore.user?.company?.id
    if (isAdminConfig && role !== 'SUPERADMIN' && !hasCompany) {
      console.log('🚫 Redirecting to /403 - missing companyId for admin config')
      return next('/403')
    }

    if ((to.meta as any).requiresScope && !authStore.hasScope(String((to.meta as any).requiresScope))) {
      console.log('🚫 Redirecting to /403 - missing scope', (to.meta as any).requiresScope)
      return next('/403')
    }

    if ((to.meta as any).permissions) {
      const required = Array.isArray((to.meta as any).permissions) ? (to.meta as any).permissions : [String((to.meta as any).permissions)]
      const hasAll = required.every((p: string) => authStore.hasPermission(p))
      if (!hasAll) {
        console.log('🚫 Redirecting to /403 - missing permissions', required)
        return next('/403')
      }
    }

    console.log('✅ Navigation allowed')
    next()
  }
})

export default router
