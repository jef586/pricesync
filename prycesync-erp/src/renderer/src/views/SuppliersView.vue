<template>
  <DashboardLayout>
    <div class="suppliers-view">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p class="text-gray-600">Gestiona los proveedores de tu empresa</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="showImportModal = true"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Importar Excel
          </button>
          <button
            @click="showNewSupplierModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Proveedor
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Proveedores"
          :value="suppliers.length"
          icon="users"
          color="blue"
        />
        <StatsCard
          title="Proveedores Activos"
          :value="activeSuppliers"
          icon="check-circle"
          color="green"
        />
        <StatsCard
          title="Productos Importados"
          :value="totalImportedProducts"
          icon="package"
          color="purple"
        />
        <StatsCard
          title="Última Importación"
          :value="lastImportDate"
          icon="calendar"
          color="orange"
        />
      </div>

      <!-- Filters -->
      <FilterBar
        v-model="filters"
        :status-options="statusOptions"
        search-placeholder="Buscar por nombre, código o email..."
        @filter-change="applyFilters"
        @search="debouncedSearch"
        class="mb-6"
      />

      <!-- Data Table -->
      <DataTable
        :columns="tableColumns"
        :data="suppliers"
        :loading="isLoading"
        :pagination="pagination"
        @page-change="handlePageChange"
        @row-click="handleRowClick"
        @sort="handleSort"
        class="mb-6"
      >
        <template #cell-name="{ item }">
          <div>
            <div class="font-medium text-gray-900">{{ item.name }}</div>
            <div class="text-sm text-gray-500">{{ item.code }}</div>
          </div>
        </template>

        <template #cell-contact="{ item }">
          <div>
            <div class="text-sm text-gray-900">{{ item.email }}</div>
            <div class="text-sm text-gray-500">{{ item.phone }}</div>
          </div>
        </template>

        <template #cell-status="{ item }">
          <span :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          ]">
            {{ item.status === 'active' ? 'Activo' : 'Inactivo' }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              @click.stop="viewSupplier(item.id)"
              class="text-blue-600 hover:text-blue-900"
              title="Ver detalles"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              @click.stop="editSupplier(item.id)"
              class="text-indigo-600 hover:text-indigo-900"
              title="Editar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </template>
      </DataTable>

      <!-- Universal Import Modal -->
      <UniversalImportModal
        v-if="showImportModal"
        type="suppliers"
        @close="showImportModal = false"
        @success="handleImportSuccess"
      />

      <!-- New Supplier Modal -->
      <SupplierFormModal
        v-if="showNewSupplierModal"
        @close="showNewSupplierModal = false"
        @supplier-created="handleSupplierCreated"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSuppliers } from '@/composables/useSuppliers'
import { debounce } from 'lodash-es'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import StatsCard from '@/components/atoms/StatsCard.vue'
import UniversalImportModal from '@/components/suppliers/UniversalImportModal.vue'
import SupplierFormModal from '@/components/suppliers/SupplierFormModal.vue'

const router = useRouter()

// Composables
const {
  suppliers,
  isLoading,
  hasError,
  error,
  pagination,
  fetchSuppliers
} = useSuppliers()

// State
const filters = ref({
  search: '',
  status: '',
  page: 1,
  limit: 10,
  sortBy: 'name',
  sortOrder: 'asc' as 'asc' | 'desc'
})

const showImportModal = ref(false)
const showNewSupplierModal = ref(false)

// Options for filters
const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' }
]

// Table columns
const tableColumns = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'name', label: 'Proveedor', sortable: true },
  { key: 'contact', label: 'Contacto' },
  { key: 'taxId', label: 'RUC/DNI', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'actions', label: 'Acciones', width: '120px' }
]

// Computed
const activeSuppliers = computed(() => 
  suppliers.value.filter(s => s.status === 'active').length
)

const totalImportedProducts = computed(() => 
  suppliers.value.reduce((total, supplier) => 
    total + (supplier.importedProductsCount || 0), 0
  )
)

const lastImportDate = computed(() => {
  const dates = suppliers.value
    .map(s => s.lastImportDate)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  return dates.length > 0 
    ? new Date(dates[0]).toLocaleDateString('es-ES')
    : 'Nunca'
})

// Methods
const applyFilters = () => {
  filters.value.page = 1
  fetchSuppliers(filters.value)
}

const debouncedSearch = debounce((searchTerm: string) => {
  filters.value.search = searchTerm
  applyFilters()
}, 300)

const handlePageChange = (page: number) => {
  filters.value.page = page
  fetchSuppliers(filters.value)
}

const handleSort = (column: string, order: 'asc' | 'desc') => {
  filters.value.sortBy = column
  filters.value.sortOrder = order
  applyFilters()
}

const handleRowClick = (supplier: any) => {
  viewSupplier(supplier.id)
}

const viewSupplier = (id: string) => {
  router.push(`/suppliers/${id}`)
}

const editSupplier = (id: string) => {
  router.push(`/suppliers/${id}/edit`)
}

const handleImportSuccess = () => {
  showImportModal.value = false
  // Refrescar la lista de proveedores
  fetchSuppliers(filters.value)
}

const handleSupplierCreated = () => {
  showNewSupplierModal.value = false
  fetchSuppliers(filters.value)
}

// Lifecycle
onMounted(() => {
  fetchSuppliers(filters.value)
})
</script>

<style scoped>
.suppliers-view {
  @apply space-y-6;
}
</style>