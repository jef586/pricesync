<template>
  <DashboardLayout>
    <div class="customer-detail-view">
      <!-- Loading State -->
      <div v-if="isLoadingCustomer" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando cliente...</p>
        </div>
      </div>

      <!-- Customer Details -->
      <div v-else-if="customer" class="space-y-6">
        <!-- Header -->
        <BaseCard>
          <div class="page-header">
            <div class="flex items-center gap-4">
              <BaseButton
                variant="ghost"
                @click="$router.back()"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </BaseButton>
              <h1 class="page-title">{{ customer.name }}</h1>
              <span 
                class="status-badge"
                :class="getStatusClasses(customer.status)"
              >
                {{ getStatusLabel(customer.status) }}
              </span>
            </div>
            <p class="page-subtitle">{{ getTypeLabel(customer.type) }} • Registrado el {{ formatDate(customer.createdAt) }}</p>
          </div>
          
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              @click="editCustomer"
              title="Editar cliente"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </BaseButton>
            
            <BaseButton
              variant="primary"
              size="sm"
              @click="createInvoice"
              title="Crear factura para este cliente"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Factura
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Customer Information -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Basic Information -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">Información Básica</h3>
            </template>
            
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500">CUIT/CUIL/DNI</label>
                <p class="text-gray-900">{{ customer.taxId }}</p>
              </div>
              
              <div>
                <label class="text-sm font-medium text-gray-500">Tipo de Cliente</label>
                <p class="text-gray-900">{{ getTypeLabel(customer.type) }}</p>
              </div>
              
              <div>
                <label class="text-sm font-medium text-gray-500">Estado</label>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClasses(customer.status)"
                >
                  {{ getStatusLabel(customer.status) }}
                </span>
              </div>
            </div>
          </BaseCard>

          <!-- Contact Information -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">Información de Contacto</h3>
            </template>
            
            <div class="space-y-4">
              <div v-if="customer.email">
                <label class="text-sm font-medium text-gray-500">Email</label>
                <p class="text-gray-900">
                  <a :href="`mailto:${customer.email}`" class="text-blue-600 hover:text-blue-800">
                    {{ customer.email }}
                  </a>
                </p>
              </div>
              
              <div v-if="customer.phone">
                <label class="text-sm font-medium text-gray-500">Teléfono</label>
                <p class="text-gray-900">
                  <a :href="`tel:${customer.phone}`" class="text-blue-600 hover:text-blue-800">
                    {{ customer.phone }}
                  </a>
                </p>
              </div>
              
              <div v-if="customer.address">
                <label class="text-sm font-medium text-gray-500">Dirección</label>
                <p class="text-gray-900">{{ customer.address }}</p>
                <p v-if="customer.city || customer.state" class="text-gray-600 text-sm">
                  {{ [customer.city, customer.state, customer.country].filter(Boolean).join(', ') }}
                </p>
              </div>
            </div>
          </BaseCard>

          <!-- Commercial Information -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">Información Comercial</h3>
            </template>
            
            <div class="space-y-4">
              <div v-if="customer.creditLimit">
                <label class="text-sm font-medium text-gray-500">Límite de Crédito</label>
                <p class="text-gray-900">{{ formatCurrency(customer.creditLimit) }}</p>
              </div>
              
              <div v-if="customer.paymentTerms">
                <label class="text-sm font-medium text-gray-500">Términos de Pago</label>
                <p class="text-gray-900">{{ customer.paymentTerms }} días</p>
              </div>
              
              <div>
                <label class="text-sm font-medium text-gray-500">Última Actualización</label>
                <p class="text-gray-900">{{ formatDate(customer.updatedAt) }}</p>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Recent Invoices -->
        <BaseCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Facturas Recientes</h3>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="viewAllInvoices"
              >
                Ver todas
              </BaseButton>
            </div>
          </template>
          
          <div class="text-center py-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No hay facturas para este cliente</p>
            <BaseButton
              variant="primary"
              size="sm"
              class="mt-4"
              @click="createInvoice"
            >
              Crear Primera Factura
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="text-center py-12">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-lg font-medium text-red-800 mb-2">Error al cargar cliente</h3>
          <p class="text-red-600 mb-4">{{ error }}</p>
          <BaseButton
            variant="outline"
            @click="loadCustomer"
          >
            Reintentar
          </BaseButton>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { useCustomers, type Customer } from '@/composables/useCustomers'

// Composables
const router = useRouter()
const route = useRoute()
const { 
  fetchCustomer, 
  isLoading, 
  hasError, 
  error, 
  clearError,
  getStatusLabel,
  getTypeLabel,
  getStatusColor
} = useCustomers()

// State
const isLoadingCustomer = ref(false)
const customer = ref<Customer | null>(null)

// Methods
const loadCustomer = async () => {
  try {
    isLoadingCustomer.value = true
    clearError()
    const customerId = route.params.id as string
    const customerData = await fetchCustomer(customerId)
    customer.value = customerData
  } catch (err) {
    console.error('Error loading customer:', err)
  } finally {
    isLoadingCustomer.value = false
  }
}

const editCustomer = () => {
  router.push(`/customers/${customer.value?.id}/edit`)
}

const createInvoice = () => {
  router.push(`/invoices/new?customerId=${customer.value?.id}`)
}

const viewAllInvoices = () => {
  router.push(`/invoices?customerId=${customer.value?.id}`)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

const getStatusClasses = (status: Customer['status']) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Lifecycle
onMounted(() => {
  loadCustomer()
})
</script>

<style scoped>
.customer-detail-view {
  @apply p-6 max-w-6xl mx-auto;
}

.page-header {
  @apply flex items-center justify-between mb-6;
}

.page-title {
  @apply text-2xl font-bold text-gray-900;
}

.page-subtitle {
  @apply text-gray-600 mt-1;
}

.status-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}
</style>