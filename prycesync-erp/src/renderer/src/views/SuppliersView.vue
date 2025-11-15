<template>
  <DashboardLayout>
    <div class="suppliers-view">
      <!-- Header -->
      <PageHeader
        title="Gestión de Proveedores"
        subtitle="Administra tus proveedores y sus listas de precios"
      />

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Proveedores"
          :value="totalSuppliers"
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
          title="Con Listas Importadas"
          :value="suppliersWithImports"
          icon="package"
          color="purple"
        />
        <StatsCard
          title="Última Importación"
          :value="lastImportDate"
          icon="calendar"
          color="yellow"
        />
      </div>

      <!-- Filtros -->
      <FilterBar
        v-model="filters"
        :status-options="statusOptions"
        :show-date-range="false"
        search-placeholder="Buscar por nombre, código o contacto..."
        :debounce-ms="300"
        @filter-change="handleFilterChange"
        @search="handleSearch"
        class="mb-6"
      >
        <template #custom-filters>
          <div class="flex gap-2">
            <BaseButton variant="primary" size="sm" @click="handleNewSupplier">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Proveedor
            </BaseButton>
            <BaseButton variant="secondary" size="sm" @click="handleImport">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Importar Excel
            </BaseButton>
          </div>
        </template>
      </FilterBar>

      <!-- Tabla de proveedores -->
      <SuppliersTable
        :suppliers="suppliers"
        :loading="loading"
        :current-page="currentPage"
        :page-size="pageSize"
        :total-items="totalItems"
        :total-pages="totalPages"
        @page-change="handlePageChange"
        @sort="handleSort"
        @refresh="refreshData"
      />

      <!-- Modal de importación general -->
      <UniversalImportModal
        v-if="showImportModal"
        type="suppliers"
        @close="closeImportModal"
        @success="handleImportSuccess"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSuppliersStore } from '@/stores/suppliers'
import { useNotifications } from '@/composables/useNotifications'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import StatsCard from '@/components/atoms/StatsCard.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import SuppliersTable from '@/components/suppliers/SuppliersTable.vue'
import UniversalImportModal from '@/components/suppliers/UniversalImportModal.vue'

const router = useRouter()
const route = useRoute()
const suppliersStore = useSuppliersStore()
const notifications = useNotifications()
const showSuccess = notifications.success
const showError = notifications.error

// Estado del store
const { items: suppliers, total: totalItems, page: currentPage, limit: pageSize, loading, error } = storeToRefs(suppliersStore)

// Estado local para filtros
const filters = ref<{
  search: string
  status: string
}>({
  search: '',
  status: ''
})
const showImportModal = ref(false)

// Computed
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const statusOptions = computed(() => [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' }
])

const totalSuppliers = computed(() => totalItems.value)

const activeSuppliers = computed(() => 
  Array.isArray(suppliers.value) ? suppliers.value.filter(s => s.status === 'active').length : 0
)

const suppliersWithImports = computed(() => 
  Array.isArray(suppliers.value) ? suppliers.value.filter(s => s.importedProductsCount && s.importedProductsCount > 0).length : 0
)

const lastImportDate = computed(() => {
  if (!Array.isArray(suppliers.value)) return 'Nunca'
  
  const dates = suppliers.value
    .map(s => s.lastImportDate)
    .filter(Boolean)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())
  
  return dates.length > 0 
    ? new Date(dates[0]!).toLocaleDateString('es-ES')
    : 'Nunca'
})

// Métodos
const loadData = async () => {
  try {
    const requestFilters = {
      q: filters.value.search,
      status: filters.value.status || undefined,
      page: currentPage.value,
      limit: pageSize.value,
      sort: suppliersStore.filters.sort || 'name',
      order: suppliersStore.filters.order || 'asc'
    }
    
    await suppliersStore.list(requestFilters)
    
    if (error.value) {
      showError(error.value)
    }
  } catch (err) {
    console.error('Error al cargar proveedores:', err)
    showError('Error al cargar la lista de proveedores')
  }
}

const refreshData = () => {
  loadData()
}

const handlePageChange = async (page: number) => {
  suppliersStore.setPage(page)
  await loadData()
  updateURL()
}

const handleSort = async (sort: 'name' | 'code' | 'updated_at', order: 'asc' | 'desc') => {
  suppliersStore.setFilters({ sort, order })
  await loadData()
  updateURL()
}

const handleNewSupplier = () => {
  router.push('/suppliers/new')
}

const handleImport = () => {
  showImportModal.value = true
}

const closeImportModal = () => {
  showImportModal.value = false
}

const handleImportSuccess = () => {
  closeImportModal()
  showSuccess('Importación completada exitosamente')
  refreshData()
}

const handleFilterChange = (newFilters: any) => {
  filters.value = newFilters
  suppliersStore.setPage(1)
  loadData()
  updateURL()
}

const handleSearch = (query: string) => {
  // Search is already handled by filter-change event
}

const updateURL = () => {
  const query: any = {}
  
  if (filters.value.search) query.q = filters.value.search
  if (filters.value.status) query.status = filters.value.status
  if (currentPage.value > 1) query.page = currentPage.value
  if (suppliersStore.filters.sort !== 'name') query.sort = suppliersStore.filters.sort
  if (suppliersStore.filters.order !== 'asc') query.order = suppliersStore.filters.order
  
  router.replace({
    path: route.path,
    query
  })
}

const parseURLParams = () => {
  const query = route.query
  
  if (query.q) filters.value.search = String(query.q)
  if (query.status) filters.value.status = String(query.status)
  if (query.page) suppliersStore.setPage(Number(query.page))
  if (query.sort || query.order) {
    const sortValue = String(query.sort || 'name')
    const validSortValues: Array<'name' | 'code' | 'updated_at'> = ['name', 'code', 'updated_at']
    const sort = validSortValues.includes(sortValue as any) ? sortValue as 'name' | 'code' | 'updated_at' : 'name'
    
    suppliersStore.setFilters({
      sort,
      order: String(query.order || 'asc') as 'asc' | 'desc'
    })
  }
}

// Watchers
watch(filters, async () => {
  suppliersStore.setPage(1) // Resetear a la primera página
  await loadData()
  updateURL()
})

// Lifecycle
onMounted(async () => {
  parseURLParams()
  await loadData()
})
</script>

<style scoped>
.suppliers-view {
  @apply space-y-6;
}
</style>