<template>
  <DashboardLayout>
    <div class="customers-view space-y-6">
      <!-- Header (alineado al estilo de Proveedores) -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Clientes</h1>
          <p class="text-gray-600 dark:text-gray-300">Administra todos los clientes de tu empresa</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="$router.push('/customers/new')"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Cliente
          </button>
        </div>
      </div>

      <!-- Filters -->
      <FilterBar
        v-model="filters"
        :status-options="statusOptions"
        :type-options="typeOptions"
        search-placeholder="Buscar por nombre, CUIT o email..."
        @filter-change="applyFilters"
        @search="debouncedSearch"
        class="mb-6"
      />

      <!-- Data Table -->
      <DataTable
        :data="customers"
        :columns="tableColumns"
        :loading="isLoading"
        :paginated="true"
        :page-size="pagination.limit"
        :show-header="false"
        @row-click="handleRowClick"
        class="mb-6"
      >
        <!-- Custom cell templates -->
        <template #cell-code="{ item }">
          <div class="font-mono text-sm">
            {{ item.code }}
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

        <template #cell-name="{ item }">
          <div>
            <div class="customer-name font-medium">{{ item.name }}</div>
            <div class="customer-email text-sm">{{ item.email }}</div>
          </div>
        </template>

        <template #cell-taxId="{ item }">
          <div class="font-mono text-sm">
            {{ item.taxId }}
          </div>
        </template>

        <template #cell-location="{ item }">
          <div class="text-sm">
            <div>{{ item.city }}, {{ item.state }}</div>
            <div class="text-gray-500">{{ item.country }}</div>
          </div>
        </template>

        <template #cell-phone="{ item }">
          <div class="text-sm">
            {{ item.phone }}
          </div>
        </template>

        <template #actions="{ item }">
          <div class="flex items-center gap-2">
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="viewCustomer(item.id)"
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
              @click.stop="editCustomer(item.id)"
              title="Editar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </BaseButton>

            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="createInvoiceForCustomer(item.id)"
              title="Nueva Factura"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
            <p class="text-gray-500 mb-4">Comienza agregando tu primer cliente</p>
            <BaseButton
              variant="primary"
              @click="$router.push('/customers/new')"
            >
              Nuevo Cliente
            </BaseButton>
          </div>
        </template>
      </DataTable>

      <!-- Delete Confirmation Modal -->
      <ConfirmModal
        v-model="showDeleteModal"
        title="Eliminar Cliente"
        :message="`¿Estás seguro de que deseas eliminar el cliente ${customerToDelete?.name}?`"
        :details="`CUIT: ${customerToDelete?.taxId || 'N/A'} | Email: ${customerToDelete?.email || 'N/A'} | Tipo: ${customerToDelete ? getTypeLabel(customerToDelete.type) : ''}`"
        variant="danger"
        confirm-text="Eliminar Cliente"
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
import PageHeader from '../components/molecules/PageHeader.vue'
import FilterBar from '../components/molecules/FilterBar.vue'
import BaseButton from '../components/atoms/BaseButton.vue'
import BaseCard from '../components/atoms/BaseCard.vue'
import BaseInput from '../components/atoms/BaseInput.vue'
import DataTable from '../components/atoms/DataTable.vue'
import ConfirmModal from '../components/atoms/ConfirmModal.vue'
import { useCustomers, type Customer, type CustomerFilters } from '../composables/useCustomers'

const router = useRouter()

// Composables
const {
  customers,
  isLoading,
  hasError,
  error,
  pagination,
  fetchCustomers,
  deleteCustomer,
  clearError,
  getStatusLabel,
  getTypeLabel,
  getStatusColor
} = useCustomers()

// Local state
const filters = ref<CustomerFilters>({
  search: '',
  status: '',
  type: '',
  page: 1,
  limit: 8,
  sortBy: 'name',
  sortOrder: 'asc'
})

// Filter options
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' }
]

const typeOptions = [
  { value: 'individual', label: 'Persona Física' },
  { value: 'company', label: 'Empresa' },
  { value: 'government', label: 'Gobierno' }
]

const showDeleteModal = ref(false)
const customerToDelete = ref<Customer | null>(null)

// Table columns configuration
const tableColumns = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'name', label: 'Cliente', sortable: true },
  { key: 'taxId', label: 'CUIT/DNI', sortable: true },
  { key: 'type', label: 'Tipo', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'location', label: 'Ubicación', sortable: false },
  { key: 'phone', label: 'Teléfono', sortable: false }
]

// Computed
const getStatusClasses = (status: Customer['status']) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Debounced search
let searchTimeout: NodeJS.Timeout
const debouncedSearch = (query: string) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.search = query
    applyFilters()
  }, 500)
}

// Methods
const loadCustomers = async () => {
  await fetchCustomers(filters.value)
}

const applyFilters = () => {
  filters.value.page = 1
  loadCustomers()
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    type: '',
    page: 1,
    limit: 8,
    sortBy: 'name',
    sortOrder: 'asc'
  }
  loadCustomers()
}

const refreshCustomers = () => {
  loadCustomers()
}

const handleRowClick = (customer: Customer) => {
  viewCustomer(customer.id)
}

const viewCustomer = (id: string) => {
  router.push(`/customers/${id}`)
}

const editCustomer = (id: string) => {
  router.push(`/customers/${id}/edit`)
}

const createInvoiceForCustomer = (customerId: string) => {
  router.push(`/invoices/new?customer=${customerId}`)
}

const confirmDelete = (customer: Customer) => {
  customerToDelete.value = customer
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!customerToDelete.value) return

  try {
    await deleteCustomer(customerToDelete.value.id)
    showDeleteModal.value = false
    customerToDelete.value = null
    // Recargar la lista de clientes después de eliminar
    await loadCustomers()
  } catch (err) {
    // Error is handled by the composable
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  customerToDelete.value = null
}

// Lifecycle
onMounted(() => {
  loadCustomers()
})
</script>

<style scoped>
.customers-view {}
</style>
<style scoped>
/* Mejora de visibilidad para columna Cliente usando tokens del sistema */
.customer-name { color: var(--ps-text-primary); }
.customer-email { color: var(--ps-text-secondary); }
</style>
