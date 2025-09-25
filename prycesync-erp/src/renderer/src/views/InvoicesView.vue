<template>
  <DashboardLayout>
    <div class="invoices-view">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Facturas</h1>
          <p class="page-subtitle">Administra todas las facturas de tu empresa</p>
        </div>
        <BaseButton
          variant="primary"
          @click="$router.push('/invoices/new')"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva Factura
        </BaseButton>
      </div>

      <!-- Filters -->
      <BaseCard class="mb-6">
        <div class="filters-grid">
          <BaseInput
            v-model="filters.search"
            placeholder="Buscar por número, cliente o notas..."
            @input="debouncedSearch"
          />
          
          <select
            v-model="filters.status"
            class="filter-select"
            @change="applyFilters"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="overdue">Vencida</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <select
            v-model="filters.type"
            class="filter-select"
            @change="applyFilters"
          >
            <option value="">Todos los tipos</option>
            <option value="A">Factura A</option>
            <option value="B">Factura B</option>
            <option value="C">Factura C</option>
          </select>

          <BaseInput
            v-model="filters.dateFrom"
            type="date"
            label="Desde"
            @change="applyFilters"
          />

          <BaseInput
            v-model="filters.dateTo"
            type="date"
            label="Hasta"
            @change="applyFilters"
          />

          <BaseButton
            variant="ghost"
            @click="clearFilters"
          >
            Limpiar Filtros
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Data Table -->
      <DataTable
        :data="invoices"
        :columns="tableColumns"
        :loading="isLoading"
        :paginated="true"
        :page-size="pagination.limit"
        @row-click="handleRowClick"
      >
        <template #actions>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="refreshInvoices"
            :loading="isLoading"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </BaseButton>
        </template>

        <!-- Custom cell templates -->
        <template #cell-number="{ item }">
          <div class="font-mono text-sm">
            {{ item.number }}
          </div>
        </template>

        <template #cell-type="{ item }">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {{ getTypeLabel(item.type) }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <span :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            getStatusClasses(item.status)
          ]">
            {{ getStatusLabel(item.status) }}
          </span>
        </template>

        <template #cell-customer="{ item }">
          <div>
            <div class="font-medium text-gray-900">{{ item.customer.name }}</div>
            <div class="text-sm text-gray-500">{{ item.customer.taxId }}</div>
          </div>
        </template>

        <template #cell-total="{ item }">
          <div class="font-medium text-right">
            {{ formatCurrency(item.total) }}
          </div>
        </template>

        <template #cell-issueDate="{ item }">
          <div class="text-sm">
            {{ formatDate(item.issueDate) }}
          </div>
        </template>

        <template #actions="{ item }">
          <div class="flex items-center gap-2">
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="viewInvoice(item.id)"
              title="Ver detalles"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </BaseButton>

            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="editInvoice(item.id)"
              title="Editar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </BaseButton>

            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="duplicateInvoiceAction(item.id)"
              title="Duplicar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </BaseButton>

            <BaseButton
              variant="danger"
              size="sm"
              @click.stop="confirmDelete(item)"
              title="Eliminar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </BaseButton>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay facturas</h3>
            <p class="text-gray-500 mb-4">Comienza creando tu primera factura</p>
            <BaseButton
              variant="primary"
              @click="$router.push('/invoices/new')"
            >
              Nueva Factura
            </BaseButton>
          </div>
        </template>
      </DataTable>

      <!-- Delete Confirmation Modal -->
      <ConfirmModal
        v-model="showDeleteModal"
        title="Eliminar Factura"
        :message="`¿Estás seguro de que deseas eliminar la factura ${invoiceToDelete?.number}?`"
        details="Esta acción no se puede deshacer."
        variant="danger"
        confirm-text="Eliminar"
        cancel-text="Cancelar"
        :loading="isLoading"
        @confirm="handleDelete"
        @cancel="cancelDelete"
      />

      <!-- Error Alert -->
      <div v-if="hasError" class="fixed bottom-4 right-4 max-w-md">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">{{ error }}</p>
            </div>
            <div class="ml-auto pl-3">
              <button
                @click="clearError"
                class="inline-flex text-red-400 hover:text-red-600"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/organisms/DashboardLayout.vue'
import BaseButton from '../components/atoms/BaseButton.vue'
import BaseCard from '../components/atoms/BaseCard.vue'
import BaseInput from '../components/atoms/BaseInput.vue'
import DataTable from '../components/atoms/DataTable.vue'
import ConfirmModal from '../components/atoms/ConfirmModal.vue'
import { useInvoices, type Invoice, type InvoiceFilters } from '../composables/useInvoices'

const router = useRouter()

// Composables
const {
  invoices,
  isLoading,
  hasError,
  error,
  pagination,
  fetchInvoices,
  deleteInvoice,
  duplicateInvoice,
  clearError,
  formatCurrency,
  formatDate,
  getStatusLabel,
  getTypeLabel,
  getStatusColor
} = useInvoices()

// Local state
const filters = ref<InvoiceFilters>({
  search: '',
  status: '',
  type: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

const showDeleteModal = ref(false)
const invoiceToDelete = ref<Invoice | null>(null)

// Table columns configuration
const tableColumns = [
  { key: 'number', label: 'Número', sortable: true },
  { key: 'type', label: 'Tipo', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'customer', label: 'Cliente', sortable: false },
  { key: 'total', label: 'Total', sortable: true, class: 'text-right' },
  { key: 'issueDate', label: 'Fecha', sortable: true }
]

// Computed
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

// Debounced search
let searchTimeout: NodeJS.Timeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

// Methods
const loadInvoices = async () => {
  await fetchInvoices(filters.value)
}

const applyFilters = () => {
  filters.value.page = 1
  loadInvoices()
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }
  loadInvoices()
}

const refreshInvoices = () => {
  loadInvoices()
}

const handleRowClick = (invoice: Invoice) => {
  viewInvoice(invoice.id)
}

const viewInvoice = (id: string) => {
  router.push(`/invoices/${id}`)
}

const editInvoice = (id: string) => {
  router.push(`/invoices/${id}/edit`)
}

const duplicateInvoiceAction = async (id: string) => {
  try {
    const duplicated = await duplicateInvoice(id)
    router.push(`/invoices/${duplicated.id}/edit`)
  } catch (err) {
    // Error is handled by the composable
  }
}

const confirmDelete = (invoice: Invoice) => {
  invoiceToDelete.value = invoice
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!invoiceToDelete.value) return

  try {
    await deleteInvoice(invoiceToDelete.value.id)
    showDeleteModal.value = false
    invoiceToDelete.value = null
  } catch (err) {
    // Error is handled by the composable
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  invoiceToDelete.value = null
}

// Lifecycle
onMounted(() => {
  loadInvoices()
})
</script>

<style scoped>
.invoices-view {
  @apply p-6;
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

.filters-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4;
}

.filter-select {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}

.filter-select:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}
</style>