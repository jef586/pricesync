<template>
  <DashboardLayout>
    <div class="products-view">
      <!-- Header -->
      <PageHeader
        title="Gestión de Productos"
        subtitle="Administra el inventario y productos de tu empresa"
      >
        <template #actions>
          <BaseButton
            variant="primary"
            @click="$router.push('/products/new')"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Producto
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Filters -->
      <FilterBar
        v-model="filters"
        :status-options="statusOptions"
        search-placeholder="Buscar por nombre, SKU o descripción..."
        @filter-change="applyFilters"
        @search="debouncedSearch"
        class="mb-6"
      >
        <template #extra-filters>
          <div class="flex items-center gap-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="filters.lowStock"
                @change="applyFilters"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <span class="ml-2 text-sm text-gray-700">Solo stock bajo</span>
            </label>
          </div>
        </template>
      </FilterBar>

      <!-- Data Table -->
      <DataTable
        :data="products || []"
        :columns="tableColumns"
        :loading="isLoading"
        :paginated="true"
        :page-size="pagination.limit"
        :show-header="false"
        @row-click="handleRowClick"
      >
        <!-- Custom cell templates -->
        <template #cell-sku="{ item }">
          <div class="font-mono text-sm">
            {{ item.code }}
          </div>
        </template>

        <template #cell-name="{ item }">
          <div>
            <div class="product-name font-medium">{{ item.name }}</div>
            <div class="product-desc text-sm">{{ item.description }}</div>
          </div>
        </template>

        <template #cell-category="{ item }">
          <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {{ item.category?.name || 'Sin categoría' }}
          </span>
        </template>

        <template #cell-stock="{ item }">
          <div class="flex items-center">
            <span :class="[
              'font-medium',
              item.minStock && item.stock <= item.minStock ? 'text-red-600' : 'stock-value'
            ]">
              {{ item.stock }}
            </span>
            <span class="stock-unit text-sm ml-1">unid</span>
            <svg v-if="item.minStock && item.stock <= item.minStock" 
                 class="w-4 h-4 text-red-500 ml-1" 
                 fill="currentColor" 
                 viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
        </template>

        <template #cell-prices="{ item }">
          <div class="text-sm">
            <div class="price-value font-medium">${{ formatCurrency(item.sale_price || item.salePrice) }}</div>
            <div class="price-cost">Costo: ${{ formatCurrency(item.cost_price || item.costPrice) }}</div>
          </div>
        </template>

        <template #cell-status="{ item }">
          <span :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            getStatusClasses(item.status)
          ]">
            {{ getStatusLabel(item.status) }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="viewProduct(item.id)"
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
              @click.stop="editProduct(item.id)"
              title="Editar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              @click.stop="showStockModal(item)"
              title="Actualizar stock"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 6v10h6V6H9z" />
              </svg>
            </BaseButton>
          </div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <Pagination
        v-if="pagination.totalPages > 1"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total-items="pagination.total"
        :items-per-page="pagination.limit"
        @page-change="handlePageChange"
        class="mt-6"
      />

      <!-- Stock Update Modal -->
      <StockUpdateModal
        v-if="showStockUpdateModal"
        :product="selectedProduct"
        @close="showStockUpdateModal = false"
        @updated="handleStockUpdated"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProducts } from '@/composables/useProducts'
import { debounce } from 'lodash-es'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import Pagination from '@/components/atoms/Pagination.vue'
import StatsCard from '@/components/atoms/StatsCard.vue'
import StockUpdateModal from '@/components/products/StockUpdateModal.vue'

const router = useRouter()

// Composables
const {
  products,
  isLoading,
  hasError,
  error,
  pagination,
  lowStockProducts,
  fetchProducts,
  updateStock
} = useProducts()

// State
const filters = ref({
  search: '',
  status: '',
  lowStock: false,
  page: 1,
  limit: 10,
  sortBy: 'name',
  sortOrder: 'asc' as 'asc' | 'desc'
})

const showStockUpdateModal = ref(false)
const selectedProduct = ref(null)
let searchTimeout: NodeJS.Timeout | null = null

// Options for filters
const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'discontinued', label: 'Descontinuado' }
]

// Table columns
const tableColumns = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'name', label: 'Producto', sortable: true },
  { key: 'category', label: 'Categoría' },
  { key: 'stock', label: 'Stock', sortable: true },
  { key: 'prices', label: 'Precios' },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'actions', label: 'Acciones', width: '120px' }
]

// Computed
const activeProductsCount = computed(() => 
  products.value.filter(p => p.status === 'active').length
)

const totalInventoryValue = computed(() => 
  products.value.reduce((total, product) => 
    total + ((product.cost_price || product.costPrice || 0) * (product.stock || product.stockQuantity || 0)), 0
  )
)

// Methods
const applyFilters = () => {
  filters.value.page = 1
  fetchProducts(filters.value)
}

const debouncedSearch = debounce((searchTerm: string) => {
  filters.value.search = searchTerm
  applyFilters()
}, 300)

const handlePageChange = (page: number) => {
  filters.value.page = page
  fetchProducts(filters.value)
}

const handleRowClick = (product: any) => {
  viewProduct(product.id)
}

const viewProduct = (id: string) => {
  router.push(`/products/${id}`)
}

const editProduct = (id: string) => {
  router.push(`/products/${id}/edit`)
}

const showStockModal = (product: any) => {
  selectedProduct.value = product
  showStockUpdateModal.value = true
}

const handleStockUpdated = () => {
  showStockUpdateModal.value = false
  selectedProduct.value = null
  fetchProducts(filters.value)
}

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
    discontinued: 'Descontinuado'
  }
  return labels[status] || status
}

const getStatusClasses = (status: string) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    discontinued: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Lifecycle
onMounted(() => {
  console.log('InventoryView - onMounted called')
  fetchProducts(filters.value)
})

// Watch for route changes to refresh data
watch(() => router.currentRoute.value.path, (newPath) => {
  if (newPath === '/inventory') {
    console.log('InventoryView - Route changed to inventory, refreshing data')
    fetchProducts(filters.value)
  }
})

// Watch for products changes
watch(() => products.value, (newProducts) => {
  console.log('InventoryView - products changed:', newProducts)
  console.log('InventoryView - products length:', newProducts?.length)
}, { immediate: true })

// Watch for filter changes
watch(() => filters.value.lowStock, () => {
  applyFilters()
})
</script>

<style scoped>
.inventory-view {
  max-width: 1200px;
  margin: 0 auto;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.content-placeholder {
  background: white;
  border-radius: 0.75rem;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  color: #9ca3af;
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
}

.content-placeholder h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.content-placeholder p {
  color: #6b7280;
  margin-bottom: 0.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
</style>
<style scoped>
/* Mejorar visibilidad en modo claro/oscuro usando tokens del sistema */
.product-name { color: var(--ps-text-primary); }
.product-desc { color: var(--ps-text-secondary); }
.stock-value { color: var(--ps-text-primary); }
.stock-unit { color: var(--ps-text-secondary); }
.price-value { color: var(--ps-text-primary); font-weight: 600; }
.price-cost { color: var(--ps-text-secondary); }
</style>