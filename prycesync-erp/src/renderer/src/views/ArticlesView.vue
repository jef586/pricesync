<template>
  <DashboardLayout>
    <div class="articles-view">
      <!-- Header (alineado al estilo de Proveedores) -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Artículos</h1>
          <p class="text-gray-600 dark:text-gray-300">Administra los artículos de tu empresa</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="$router.push('/articles/new')"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Artículo
          </button>
          <button
            @click="$router.push('/articles/price-lookup')"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="10" cy="10" r="6" stroke-width="2" />
              <path d="M20 20L15.5 15.5" stroke-width="2" stroke-linecap="round" />
            </svg>
            Consulta de Precios (F9)
          </button>
        </div>
      </div>

      <!-- Filtros comunes -->
      <FilterBar
        v-model="uiFilters"
        :status-options="statusOptions"
        :stock-options="stockStateOptions"
        :show-date-range="false"
        search-placeholder="Buscar por nombre, SKU o EAN..."
        @filter-change="applyFilters"
        @search="debouncedSearch"
        class="mb-4"
      >
        <template #custom-filters="{ updateFilter }">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <!-- Nombre -->
            <div>
              <label class="filter-label">Nombre</label>
              <input v-model="uiFilters.name" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <!-- Descripción -->
            <div>
              <label class="filter-label">Descripción</label>
              <input v-model="uiFilters.description" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>

            <!-- Código de Barras -->
            <div>
              <label class="filter-label">Código de Barras</label>
              <input v-model="uiFilters.ean" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <!-- Código Proveedor -->
            <div>
              <label class="filter-label">Código Proveedor</label>
              <input v-model="uiFilters.supplierSku" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <!-- Rubro -->
            <div>
              <label class="filter-label">Rubro</label>
              <select
                :value="uiFilters.categoryId || ''"
                @change="onCategoryChange($event, updateFilter)"
                class="filter-select border rounded px-2 py-1 w-full"
              >
                <option value="">Todos</option>
                <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <!-- Sub-rubro -->
            <div>
              <label class="filter-label">Sub-rubro</label>
              <input v-model="uiFilters.subcategoryId" type="text" class="filter-input border rounded px-2 py-1 w-full" placeholder="ID o nombre" />
            </div>
            <!-- Fabricante (opcional) -->
            <div>
              <label class="filter-label">Fabricante</label>
              <input v-model="uiFilters.manufacturerId" type="text" class="filter-input border rounded px-2 py-1 w-full" placeholder="ID fabricante" />
            </div>
            <!-- Proveedor -->
            <div>
              <label class="filter-label">Proveedor</label>
              <select v-model="uiFilters.supplierId" class="filter-select border rounded px-2 py-1 w-full">
                <option value="">Todos</option>
                <option v-for="opt in supplierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <!-- IVA % -->
            <div>
              <label class="filter-label">IVA %</label>
              <select v-model="uiFilters.vatRate" class="filter-select border rounded px-2 py-1 w-full">
                <option :value="''">sin dato</option>
                <option :value="0">0</option>
                <option :value="10.5">10.5</option>
                <option :value="21">21</option>
              </select>
            </div>
            <!-- Código Interno -->
            <div>
              <label class="filter-label">Código Interno</label>
              <input v-model="uiFilters.internalCode" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            
          </div>
        </template>
      </FilterBar>

      <!-- Tabla común -->
<DataTable
  :columns="tableColumns"
  :data="store.items"
  :loading="store.loading || navigating"
  :page-size="store.pageSize"
  :show-header="false"
  :clickable-rows="true"
  @row-click="handleRowClick"
  @sort="handleSort"
  class="mb-6"
>
        <template #cell-sku="{ item }">
          <div>
            <div class="font-mono text-sm">{{ item.barcode || '—' }}</div>
            <div class="text-xs text-gray-500">SKU: {{ item.sku || '—' }}</div>
          </div>
        </template>
        <template #cell-name="{ item }">
          <div>
            <div class="font-medium">{{ item.name }}</div>
            <div class="text-xs text-gray-500">{{ item.category?.name || item.categoryName || '—' }}</div>
          </div>
        </template>
        <template #cell-pricePublic="{ value }">
          {{ formatMoney(value) }}
        </template>
        <template #cell-stock="{ item }">
          <span :class="[isLowStock(item) ? 'text-red-600 font-semibold' : 'text-gray-900']">
            {{ item.stock ?? 0 }}
          </span>
          <span v-if="item.stockMin != null" class="text-xs text-gray-500"> / min {{ item.stockMin }}</span>
        </template>
        <template #cell-active="{ value }">
          <span :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          ]">
            {{ value ? 'Activo' : 'Inactivo' }}
          </span>
        </template>
        <template #actions="{ item }">
          <div class="flex items-center gap-2">
            <BaseButton variant="secondary" size="sm" @click.stop="goEdit(item.id)">Editar</BaseButton>
            <BaseButton variant="ghost" size="sm" @click.stop="duplicateItem(item)">Duplicar</BaseButton>
            <BaseButton variant="ghost" size="sm" @click.stop="toggleActive(item)">{{ item.active ? 'Desactivar' : 'Activar' }}</BaseButton>
            <BaseButton variant="danger" size="sm" @click.stop="removeItem(item.id)">Eliminar</BaseButton>
          </div>
        </template>
      </DataTable>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import FilterBar from '@/components/molecules/FilterBar.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import { useArticleStore } from '@/stores/articles'
import { useCategories } from '@/composables/useCategories'
import { useSuppliers } from '@/composables/useSuppliers'
import { useNotifications } from '@/composables/useNotifications'

// Minimal i18n shim
function t(key: string) {
  const dict: Record<string, string> = {
    'inventory.article.list.title': 'Artículos',
    'inventory.article.list.subtitle': 'Listado, búsqueda y acciones'
  }
  return dict[key] || key
}

const store = useArticleStore()
const router = useRouter()
const navigating = ref(false)
const { categories } = useCategories()
const { suppliers, fetchSuppliers } = useSuppliers()
const { success, error } = useNotifications()

// Filtros de UI para FilterBar
const uiFilters = ref({
  search: '',
  status: '',
  categoryId: '',
  subcategoryId: '',
  name: '',
  description: '',
  ean: '',
  supplierSku: '',
  supplierId: '',
  manufacturerId: '',
  vatRate: '' as any,
  internalCode: '',
  stockState: 'all',
  
})

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' }
]

const stockStateOptions = [
  { value: 'low', label: 'Artículos con bajo stock' },
  { value: 'zero', label: 'Artículos sin stock' },
  { value: 'nocontrol', label: 'Artículos sin control de stock' }
]

const categoryOptions = computed(() => [
  { label: 'Todos', value: '' },
  ...categories.value.map((c: any) => ({ label: c.name, value: c.id }))
])

const supplierOptions = computed(() => [
  { label: 'Todos', value: '' },
  ...suppliers.value.map((s: any) => ({ label: s.name, value: s.id }))
])

const tableColumns = [
  { key: 'sku', label: 'EAN/SKU' },
  { key: 'name', label: 'Artículo', sortable: true },
  { key: 'pricePublic', label: 'Precio Público', sortable: true, class: 'text-right' },
  { key: 'stock', label: 'Stock', sortable: true },
  { key: 'active', label: 'Estado', sortable: true }
]

onMounted(async () => {
  await store.list()
  await fetchSuppliers({ limit: 50 })
})

async function reload() {
  await store.list()
}

// Mapear filtros del FilterBar a los filtros del store
function mapUiToStoreFilters() {
  const f: any = {}
  if (uiFilters.value.search) f.q = uiFilters.value.search
  if (uiFilters.value.categoryId) f.rubroId = uiFilters.value.categoryId
  if (uiFilters.value.status) {
    f.active = uiFilters.value.status === 'active' ? true : uiFilters.value.status === 'inactive' ? false : undefined
  }
  // Avanzados
  if (uiFilters.value.name) f.name = uiFilters.value.name
  if (uiFilters.value.description) f.description = uiFilters.value.description
  if (uiFilters.value.ean) f.ean = uiFilters.value.ean
  if (uiFilters.value.supplierSku) f.supplierSku = uiFilters.value.supplierSku
  if (uiFilters.value.subcategoryId) f.subcategoryId = uiFilters.value.subcategoryId
  if (uiFilters.value.supplierId) f.supplierId = uiFilters.value.supplierId
  if (uiFilters.value.manufacturerId) f.manufacturerId = uiFilters.value.manufacturerId
  if (uiFilters.value.vatRate !== '' && uiFilters.value.vatRate != null) f.vatRate = Number(uiFilters.value.vatRate)
  if (uiFilters.value.internalCode) f.internalCode = uiFilters.value.internalCode
  if (uiFilters.value.stockState) f.stockState = uiFilters.value.stockState
  return f
}

function onCategoryChange(e: Event, updateFilter: (key: string, value: any) => void) {
  const target = e.target as HTMLSelectElement
  const val = target?.value ?? ''
  updateFilter('categoryId', val || undefined)
}

const debouncedSearch = debounce(async (term: string) => {
  uiFilters.value.search = term
  const f = mapUiToStoreFilters()
  store.setFilters(f as any)
  await store.list({ ...store.filters, page: 1 })
}, 300)

async function applyFilters() {
  const f = mapUiToStoreFilters()
  store.setFilters(f as any)
  await store.list({ ...store.filters, page: 1 })
}

async function handleRowClick(item: any) {
  await goEdit(item.id)
}

async function handleSort(sortBy: string, sortOrder: 'asc' | 'desc') {
  // Si el servicio soporta sortBy/sortOrder, se enviarán; caso contrario, el DataTable ordena local.
  await store.list({ ...store.filters, sortBy: sortBy as any, sortOrder: sortOrder as any } as any)
}

async function goEdit(id: string) {
  navigating.value = true
  try {
    try { await store.get(id) } catch (_) {}
    await new Promise((r) => setTimeout(r, 250))
    await router.push({ name: 'ArticleEdit', params: { id }, query: { simple: '1' } })
  } finally {
    navigating.value = false
  }
}

function isLowStock(item: any) {
  if (item.stock == null || item.stockMin == null) return false
  return Number(item.stock) <= Number(item.stockMin)
}

function formatMoney(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}
</script>

