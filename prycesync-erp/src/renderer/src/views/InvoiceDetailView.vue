<template>
  <DashboardLayout>
    <div class="invoice-detail-view">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Cargando factura...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error al cargar la factura</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Invoice Detail Content -->
      <div v-else-if="invoice" class="space-y-6">
        <!-- Header -->
        <div class="page-header">
          <div>
            <div class="flex items-center gap-3">
              <BaseButton
                variant="ghost"
                size="sm"
                @click="goBack"
                title="Volver"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </BaseButton>
              <h1 class="page-title">Factura {{ invoice.number }}</h1>
              <span 
                class="status-badge"
                :class="getStatusClasses(invoice.status)"
              >
                {{ getStatusLabel(invoice.status) }}
              </span>
            </div>
            <p class="page-subtitle">{{ getTypeLabel(invoice.type) }} • Creada el {{ formatDate(invoice.createdAt) }}</p>
          </div>
          
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              @click="editInvoice"
              title="Editar factura"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </BaseButton>
            
            <BaseButton
              variant="outline"
              size="sm"
              @click="duplicateInvoice"
              title="Duplicar factura"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicar
            </BaseButton>
            
            <BaseButton
              variant="primary"
              size="sm"
              @click="downloadPDF"
              title="Descargar PDF"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF
            </BaseButton>
          </div>
        </div>

        <!-- Invoice Information Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Customer Information -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-medium text-gray-900">Cliente</h3>
            </template>
            <div class="space-y-3">
              <div>
                <p class="text-sm font-medium text-gray-500">Nombre</p>
                <p class="text-sm text-gray-900">{{ invoice.customer.name }}</p>
              </div>
              <div v-if="invoice.customer.email">
                <p class="text-sm font-medium text-gray-500">Email</p>
                <p class="text-sm text-gray-900">{{ invoice.customer.email }}</p>
              </div>
              <div v-if="invoice.customer.taxId">
                <p class="text-sm font-medium text-gray-500">CUIT/CUIL</p>
                <p class="text-sm text-gray-900">{{ invoice.customer.taxId }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Tipo</p>
                <p class="text-sm text-gray-900">{{ invoice.customer.type }}</p>
              </div>
            </div>
          </BaseCard>

          <!-- Invoice Dates -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-medium text-gray-900">Fechas</h3>
            </template>
            <div class="space-y-3">
              <div>
                <p class="text-sm font-medium text-gray-500">Fecha de emisión</p>
                <p class="text-sm text-gray-900">{{ formatDate(invoice.issueDate) }}</p>
              </div>
              <div v-if="invoice.dueDate">
                <p class="text-sm font-medium text-gray-500">Fecha de vencimiento</p>
                <p class="text-sm text-gray-900">{{ formatDate(invoice.dueDate) }}</p>
              </div>
              <div v-if="invoice.paidDate">
                <p class="text-sm font-medium text-gray-500">Fecha de pago</p>
                <p class="text-sm text-gray-900">{{ formatDate(invoice.paidDate) }}</p>
              </div>
            </div>
          </BaseCard>

          <!-- Invoice Totals -->
          <BaseCard>
            <template #header>
              <h3 class="text-lg font-medium text-gray-900">Totales</h3>
            </template>
            <div class="space-y-3">
              <div class="flex justify-between">
                <p class="text-sm font-medium text-gray-500">Subtotal</p>
                <p class="text-sm text-gray-900">{{ formatCurrency(invoice.subtotal) }}</p>
              </div>
              <div class="flex justify-between">
                <p class="text-sm font-medium text-gray-500">Impuestos</p>
                <p class="text-sm text-gray-900">{{ formatCurrency(invoice.taxAmount) }}</p>
              </div>
              <div class="flex justify-between border-t pt-3">
                <p class="text-base font-semibold text-gray-900">Total</p>
                <p class="text-base font-semibold text-gray-900">{{ formatCurrency(invoice.total) }}</p>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Invoice Items -->
        <BaseCard>
          <template #header>
            <h3 class="text-lg font-medium text-gray-900">Elementos de la factura</h3>
          </template>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto/Servicio
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unitario
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impuesto
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in invoice.items" :key="item.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {{ item.product?.name || 'Producto personalizado' }}
                      </p>
                      <p v-if="item.product?.code" class="text-sm text-gray-500">
                        Código: {{ item.product.code }}
                      </p>
                      <p v-if="item.product?.description" class="text-sm text-gray-500">
                        {{ item.product.description }}
                      </p>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ item.quantity }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatCurrency(item.unitPrice) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatCurrency(item.discount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatCurrency(item.taxAmount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    {{ formatCurrency(item.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <!-- Notes -->
        <BaseCard v-if="invoice.notes">
          <template #header>
            <h3 class="text-lg font-medium text-gray-900">Notas</h3>
          </template>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ invoice.notes }}</p>
        </BaseCard>

        <!-- Company Information -->
        <BaseCard>
          <template #header>
            <h3 class="text-lg font-medium text-gray-900">Información de la empresa</h3>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500">Nombre</p>
              <p class="text-sm text-gray-900">{{ invoice.company.name }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">CUIT</p>
              <p class="text-sm text-gray-900">{{ invoice.company.taxId }}</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../components/organisms/DashboardLayout.vue'
import BaseButton from '../components/atoms/BaseButton.vue'
import BaseCard from '../components/atoms/BaseCard.vue'
import { useInvoices, type Invoice } from '../composables/useInvoices'

const route = useRoute()
const router = useRouter()

// Composables
const {
  isLoading,
  hasError,
  error,
  fetchInvoice,
  duplicateInvoice: duplicateInvoiceAPI,
  formatCurrency,
  formatDate,
  getStatusLabel,
  getTypeLabel,
  clearError
} = useInvoices()

// Local state
const invoice = ref<Invoice | null>(null)

// Methods
const loadInvoice = async () => {
  try {
    clearError()
    const invoiceId = route.params.id as string
    invoice.value = await fetchInvoice(invoiceId)
  } catch (err) {
    console.error('Error loading invoice:', err)
  }
}

const goBack = () => {
  router.push('/invoices')
}

const editInvoice = () => {
  router.push(`/invoices/${invoice.value?.id}/edit`)
}

const duplicateInvoice = async () => {
  if (!invoice.value) return
  
  try {
    const duplicated = await duplicateInvoiceAPI(invoice.value.id)
    router.push(`/invoices/${duplicated.id}/edit`)
  } catch (err) {
    console.error('Error duplicating invoice:', err)
  }
}

const downloadPDF = () => {
  // TODO: Implement PDF download functionality
  console.log('Download PDF for invoice:', invoice.value?.id)
}

const getStatusClasses = (status: Invoice['status']) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Lifecycle
onMounted(() => {
  loadInvoice()
})
</script>

<style scoped>
.invoice-detail-view {
  @apply p-6 max-w-7xl mx-auto;
}

.page-header {
  @apply flex items-start justify-between mb-6;
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