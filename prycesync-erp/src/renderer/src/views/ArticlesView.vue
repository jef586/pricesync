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
          <button
            @click="openImportFromSupplier"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v16h16M8 12h8M8 8h8M8 16h5" />
            </svg>
            Importar desde proveedor
          </button>
        </div>
      </div>

      <FilterBar
        v-model="uiFilters"
        :status-options="statusOptions"
        :stock-options="stockStateOptions"
        :show-date-range="false"
        search-placeholder="Buscar por nombre, SKU o EAN/PLU"
        :debounce-ms="400"
        compact
        sticky
        persist-key="articles_filters"
        @filter-change="applyFilters"
        @search="onSearch"
        @apply="applyFilters"
        @reset="onReset"
        class="mb-4"
      >
        <template #advanced="{ updateFilter }">
          <div class="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-3">
            <div>
              <label class="filter-label">Nombre</label>
              <input v-model="uiFilters.name" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label class="filter-label">Descripción</label>
              <input v-model="uiFilters.description" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label class="filter-label">Código de barras</label>
              <input v-model="uiFilters.ean" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label class="filter-label">Código proveedor</label>
              <input v-model="uiFilters.supplierSku" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label class="filter-label">Rubro</label>
              <select :value="uiFilters.categoryId || ''" @change="onCategoryChange($event, updateFilter)" class="filter-select border rounded px-2 py-1 w-full">
                <option value="">Todos</option>
                <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="filter-label">Sub-rubro</label>
              <input v-model="uiFilters.subcategoryId" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label class="filter-label">Proveedor</label>
              <select v-model="uiFilters.supplierId" class="filter-select border rounded px-2 py-1 w-full">
                <option value="">Todos</option>
                <option v-for="opt in supplierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="filter-label">Fabricante</label>
              <input v-model="uiFilters.manufacturerId" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label class="filter-label">IVA %</label>
              <select v-model="uiFilters.vatRate" class="filter-select border rounded px-2 py-1 w-full">
                <option :value="''">sin dato</option>
                <option :value="0">0</option>
                <option :value="10.5">10.5</option>
                <option :value="21">21</option>
              </select>
            </div>
            <div>
              <label class="filter-label">Código interno</label>
              <input v-model="uiFilters.internalCode" type="text" class="filter-input border rounded px-2 py-1 w-full" />
            </div>
          </div>
        </template>
        <template #presets="{ applyPreset }">
          <BaseButton variant="ghost" size="sm" @click="applyPreset('solo-activos')">Solo activos</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="applyPreset('bajo-stock')">Bajo stock</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="applyPreset('sin-precios')">Sin precios</BaseButton>
        </template>
      </FilterBar>

      <!-- Tabla común -->
<DataTable
  :columns="tableColumns"
  :data="store.items"
  :loading="store.loading || navigating"
  :page-size="store.pageSize"
  :paginated="false"
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
          <div class="flex items-center justify-end gap-3">
            <BaseButton
              variant="ghost"
              size="sm"
              :aria-label="'Editar'"
              title="Editar"
              :disabled="!canModify"
              @click.stop="goEdit(item.id)"
            >
              <PencilSquareIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              :aria-label="'Duplicar'"
              title="Duplicar"
              :disabled="!canModify"
              @click.stop="duplicateItem(item)"
            >
              <DocumentDuplicateIcon class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              :aria-label="item.active ? 'Desactivar' : 'Activar'"
              :title="item.active ? 'Desactivar' : 'Activar'"
              :disabled="!canModify"
              @click.stop="toggleActive(item)"
            >
              <PowerIcon :class="['w-6 h-6', item.active ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400']" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              :aria-label="'Eliminar'"
              title="Eliminar"
              :disabled="!canDelete"
              @click.stop="removeItem(item.id)"
            >
              <TrashIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
            </BaseButton>
          </div>
        </template>
      </DataTable>

      <Pagination
        class="mt-2 mb-6"
        :current-page="store.page"
        :total-pages="Math.max(1, Math.ceil(store.total / store.pageSize))"
        :total-items="store.total"
        :items-per-page="store.pageSize"
        @pageChange="onPageChange"
      />

      <!-- Confirmaciones -->
      <ConfirmModal
        v-model="showDeleteModal"
        title="Eliminar artículo"
        message="¿Eliminar el artículo? Esta acción es reversible (soft delete)."
        confirm-text="Eliminar"
        variant="danger"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
      <ConfirmModal
        v-model="showToggleModal"
        title="Desactivar artículo"
        message="¿Desactivar este artículo? Podrás volver a activarlo luego."
        confirm-text="Desactivar"
        variant="warning"
        @confirm="confirmToggle"
        @cancel="cancelToggle"
      />
      <SupplierProductsImportModal
        v-if="showImportModal"
        @close="closeImportModal"
        @success="handleImportSuccess"
      />
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
import Pagination from '@/components/atoms/Pagination.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { useArticleStore } from '@/stores/articles'
import { useCategories } from '@/composables/useCategories'
import { useSuppliers } from '@/composables/useSuppliers'
import { useNotifications } from '@/composables/useNotifications'
import { mapUiFiltersToQuery } from '@/composables/useArticleFilters'
import { useAuthStore } from '@/stores/auth'
import { reportsService } from '@/services/reportsService'
import { PencilSquareIcon, DocumentDuplicateIcon, PowerIcon, TrashIcon } from '@heroicons/vue/24/outline'
import SupplierProductsImportModal from '@/components/articles/SupplierProductsImportModal.vue'

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
const auth = useAuthStore()

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
  return mapUiFiltersToQuery(uiFilters.value as any)
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
}, 400)

const onSearch = debouncedSearch

async function onPageChange(page: number) {
  store.setPage(page)
  await store.list({ ...store.filters, page })
}

async function applyFilters() {
  const f = mapUiToStoreFilters()
  store.setFilters(f as any)
  await store.list({ ...store.filters, page: 1 })
}

function onReset() {}

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
  return reportsService.formatCurrency(n || 0)
}

const canModify = computed(() => auth.hasAnyRole(['admin']))
const canDelete = computed(() => auth.hasAnyRole(['admin']))

const showDeleteModal = ref(false)
const deleteId = ref<string | null>(null)

const showToggleModal = ref(false)
const toggleItem = ref<any | null>(null)
const showImportModal = ref(false)

function removeItem(id: string) {
  if (!canDelete.value) return
  deleteId.value = id
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deleteId.value) return
  try {
    await store.remove(deleteId.value)
    success('Artículo eliminado')
  } catch (e: any) {
    error('Error al eliminar', e?.message)
  } finally {
    showDeleteModal.value = false
    deleteId.value = null
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  deleteId.value = null
}

async function duplicateItem(item: any) {
  if (!canModify.value) return
  try {
    const payload = { ...item, id: undefined, name: `${item.name} (copia)` }
    await store.create(payload)
    success('Artículo duplicado')
  } catch (e: any) {
    error('Error al duplicar', e?.message)
  }
}

function toggleActive(item: any) {
  if (!canModify.value) return
  if (item.active) {
    toggleItem.value = item
    showToggleModal.value = true
  } else {
    confirmToggleActivate(item)
  }
}

async function confirmToggle() {
  if (!toggleItem.value) return
  try {
    await store.update(toggleItem.value.id, { active: false })
    success('Artículo desactivado')
  } catch (e: any) {
    error('Error al desactivar', e?.message)
  } finally {
    showToggleModal.value = false
    toggleItem.value = null
  }
}

function cancelToggle() {
  showToggleModal.value = false
  toggleItem.value = null
}

async function confirmToggleActivate(item: any) {
  try {
    await store.update(item.id, { active: true })
    success('Artículo activado')
  } catch (e: any) {
    error('Error al activar', e?.message)
  }
}

function openImportFromSupplier() {
  showImportModal.value = true
}

function closeImportModal() {
  showImportModal.value = false
}

async function handleImportSuccess(results?: any) {
  closeImportModal()
  await store.list({ ...store.filters })
  const created = results?.created ?? 0
  const updated = results?.updated ?? 0
  const skipped = results?.skipped ?? 0
  success(`Importación completada: ${created} creados, ${updated} actualizados, ${skipped} omitidos`)
}
</script>
