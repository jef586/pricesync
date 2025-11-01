<template>
  <div aria-label="Tabla de artículos">
    <div class="flex items-center justify-between mb-3">
      <div class="flex-1">
        <label for="q" class="sr-only">Buscar</label>
        <input
          id="q"
          type="text"
          class="border rounded px-3 py-2 w-full"
          :placeholder="t('inventory.article.table.quickSearch.placeholder')"
          v-model="localQ"
          @keyup.enter="onSearch"
          aria-label="Buscar artículos por nombre, SKU o EAN"
        />
      </div>
      <div class="ml-3 flex items-center gap-2">
        <BaseButton variant="secondary" @click="onSearch">{{ t('actions.search') }}</BaseButton>
        <BaseButton variant="ghost" @click="$emit('reload')" aria-label="Recargar">⟳</BaseButton>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4" aria-label="Filtros">
      <div>
        <label class="block text-sm mb-1">{{ t('inventory.article.filters.category') }}</label>
        <BaseSelect v-model="localFilters.categoryId" :options="categoryOptions" />
      </div>
      <div>
        <label class="block text-sm mb-1">{{ t('inventory.article.filters.subcategory') }}</label>
        <BaseSelect v-model="localFilters.subcategoryId" :options="subcategoryOptions" />
      </div>
      <div>
        <label class="block text-sm mb-1">{{ t('inventory.article.filters.active') }}</label>
        <BaseSelect v-model="localFilters.active" :options="booleanOptions" />
      </div>
      <div>
        <label class="block text-sm mb-1">{{ t('inventory.article.filters.stockControl') }}</label>
        <BaseSelect v-model="localFilters.stockControl" :options="booleanOptions" />
      </div>
      <div>
        <label class="block text-sm mb-1">{{ t('inventory.article.filters.supplier') }}</label>
        <BaseSelect v-model="localFilters.supplierId" :options="supplierOptions" />
      </div>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-500" role="status">
      {{ t('states.loading') }}
    </div>
    <div v-else-if="error" class="p-4 bg-red-50 text-red-700" role="alert">
      <div class="flex items-center justify-between">
        <span>{{ error }}</span>
        <BaseButton variant="secondary" @click="$emit('reload')">{{ t('actions.retry') }}</BaseButton>
      </div>
    </div>
    <div v-else-if="items.length === 0" class="p-8 text-center text-gray-600">
      <p>{{ t('inventory.article.table.empty') }}</p>
      <BaseButton v-if="canCreate" variant="primary" @click="$router.push('/articles/new')">{{ t('inventory.article.actions.new') }}</BaseButton>
    </div>
    <div v-else class="overflow-x-auto" role="table" aria-label="Listado de artículos">
      <table class="min-w-full">
        <thead>
          <tr>
            <th class="text-left py-2 px-3">EAN/SKU</th>
            <th class="text-left py-2 px-3">
              <button class="underline" @click="setSort('name')">{{ t('inventory.article.fields.name') }}</button>
            </th>
            <th class="text-left py-2 px-3">{{ t('inventory.article.fields.category') }}</th>
            <th class="text-right py-2 px-3">
              <button class="underline" @click="setSort('pricePublic')">{{ t('inventory.article.fields.publicPrice') }}</button>
            </th>
            <th class="text-right py-2 px-3">IVA</th>
            <th class="text-right py-2 px-3">{{ t('inventory.article.fields.stock') }}</th>
            <th class="text-right py-2 px-3">{{ t('inventory.article.fields.stockMin') }}</th>
            <th class="text-center py-2 px-3">{{ t('inventory.article.fields.active') }}</th>
            <th class="text-left py-2 px-3">{{ t('inventory.article.fields.supplier') }}</th>
            <th class="text-left py-2 px-3">
              <button class="underline" @click="setSort('updatedAt')">{{ t('inventory.article.fields.updatedAt') }}</button>
            </th>
            <th class="py-2 px-3">{{ t('actions.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" role="row">
            <td class="py-2 px-3">
              <div class="text-sm">{{ item.barcode || '—' }}</div>
              <div class="text-xs text-gray-500">{{ item.sku || '—' }}</div>
              <div v-if="item.barcodesCount > 0" class="mt-1 inline-block text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded" aria-label="Alias count">Alias: {{ item.barcodesCount }}</div>
            </td>
            <td class="py-2 px-3">
              <div class="flex items-center gap-2">
                <span>{{ item.name }}</span>
                <span v-if="isLowStock(item)" class="inline-block text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">{{ t('inventory.article.indicators.lowStock') }}</span>
              </div>
            </td>
            <td class="py-2 px-3">
              <div class="text-sm">{{ item.categoryName || '—' }}</div>
              <div class="text-xs text-gray-500">{{ item.subcategoryName || '—' }}</div>
            </td>
            <td class="py-2 px-3 text-right">{{ formatMoney(item.pricePublic) }}</td>
            <td class="py-2 px-3 text-right">{{ formatPercent(item.taxRate) }}</td>
            <td class="py-2 px-3 text-right">{{ item.stock ?? '—' }}</td>
            <td class="py-2 px-3 text-right">{{ item.stockMin ?? '—' }}</td>
            <td class="py-2 px-3 text-center">
              <span :class="item.active ? 'text-green-600' : 'text-gray-500'" aria-label="Estado">{{ item.active ? t('states.active') : t('states.inactive') }}</span>
            </td>
            <td class="py-2 px-3">{{ item.supplierName || '—' }}</td>
            <td class="py-2 px-3 text-left">{{ formatDate(item.updatedAt) }}</td>
            <td class="py-2 px-3">
              <div class="flex items-center gap-1">
                <BaseButton v-if="canModify" variant="ghost" @click="$emit('edit', item.id)" aria-label="Editar">✎</BaseButton>
                <BaseButton v-if="canModify" variant="ghost" @click="$emit('duplicate', item)" aria-label="Duplicar">⎘</BaseButton>
                <BaseButton v-if="canModify" variant="ghost" @click="$emit('toggle-active', item)" :aria-label="item.active ? 'Desactivar' : 'Activar'">{{ item.active ? '⏻' : '⏽' }}</BaseButton>
                <!-- Replace inline ConfirmModal trigger with explicit open -->
                <BaseButton v-if="canDelete" variant="ghost" aria-label="Eliminar" @click="openDelete(item.id)">🗑</BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination using atoms/Pagination API -->
    <Pagination
      class="mt-4"
      :current-page="page"
      :total-pages="totalPages"
      :total-items="total"
      :items-per-page="pageSize"
      @pageChange="$emit('page-change', $event)"
    />

    <!-- Centralized delete confirmation modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('inventory.article.actions.delete')"
      :message="t('inventory.article.confirm.delete')"
      confirm-text="Eliminar"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import Pagination from '@/components/atoms/Pagination.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'
import { useCategories } from '@/composables/useCategories'
import { useSuppliers } from '@/composables/useSuppliers'
import { useBarcodeListener } from '@/composables/useBarcodeListener'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  loading: boolean
  error: string | null
  items: any[]
  page: number
  pageSize: number
  total: number
  filters: any
}>()

const emits = defineEmits([
  'search',
  'filter-change',
  'page-change',
  'sort-change',
  'edit',
  'duplicate',
  'toggle-active',
  'remove',
  'reload'
])

function t(key: string) {
  const dict: Record<string, string> = {
    'inventory.article.table.quickSearch.placeholder': 'Buscar por nombre, SKU o EAN…',
    'inventory.article.fields.name': 'Nombre',
    'inventory.article.fields.category': 'Rubro/Sub-rubro',
    'inventory.article.fields.publicPrice': 'Precio público',
    'inventory.article.fields.stock': 'Stock',
    'inventory.article.fields.stockMin': 'Stock mín.',
    'inventory.article.fields.active': 'Activo',
    'inventory.article.fields.supplier': 'Proveedor',
    'inventory.article.fields.updatedAt': 'Última actualización',
    'inventory.article.indicators.lowStock': 'Stock bajo',
    'inventory.article.table.empty': 'No hay artículos. Crea el primero.',
    'inventory.article.actions.new': 'Nuevo',
    'inventory.article.actions.delete': 'Eliminar',
    'inventory.article.confirm.delete': '¿Eliminar el artículo? Esta acción es reversible (soft delete).',
    'actions.search': 'Buscar',
    'actions.retry': 'Reintentar',
    'actions.actions': 'Acciones',
    'states.loading': 'Cargando…',
    'states.active': 'Activo',
    'states.inactive': 'Inactivo'
  }
  return dict[key] || key
}

const localQ = ref(props?.filters?.q || '')
const localFilters = ref({
  categoryId: props?.filters?.categoryId || null,
  subcategoryId: props?.filters?.subcategoryId || null,
  active: props?.filters?.active ?? null,
  stockControl: props?.filters?.stockControl ?? null,
  supplierId: props?.filters?.supplierId || null
})

const { categories, subcategoriesByParent } = useCategories()
const { suppliers } = useSuppliers()
const auth = useAuthStore()

// Permissions
const canCreate = computed(() => auth.hasAnyRole(['admin']))
const canModify = computed(() => auth.hasAnyRole(['admin']))
const canDelete = computed(() => auth.hasAnyRole(['admin']))

const categoryOptions = computed(() => [
  { label: 'Todos', value: null },
  ...categories.value.map((c: any) => ({ label: c.name, value: c.id }))
])

const subcategoryOptions = computed(() => {
  const subs = localFilters.value.categoryId ? subcategoriesByParent.value[localFilters.value.categoryId] || [] : []
  return [{ label: 'Todos', value: null }, ...subs.map((s: any) => ({ label: s.name, value: s.id }))]
})

const booleanOptions = [
  { label: 'Todos', value: null },
  { label: 'Sí', value: true },
  { label: 'No', value: false }
]

const supplierOptions = computed(() => [
  { label: 'Todos', value: null },
  ...suppliers.value.map((s: any) => ({ label: s.name, value: s.id }))
])

function onSearch() {
  emits('search', localQ.value)
}

function setSort(field: string) {
  emits('sort-change', field, 'asc')
}

watch(localFilters, (val) => {
  emits('filter-change', val)
}, { deep: true })

function isLowStock(item: any) {
  if (item.stock == null || item.stockMin == null) return false
  return Number(item.stock) <= Number(item.stockMin)
}

function formatMoney(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function formatPercent(n: number | null | undefined) {
  if (n == null) return '—'
  return `${n}%`
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

// Compute total pages for atoms/Pagination
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

// Local state for delete confirmation
const showDeleteModal = ref(false)
const deleteId = ref<string | null>(null)

const openDelete = (id: string) => {
  deleteId.value = id
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (deleteId.value) {
    emits('remove', deleteId.value)
  }
  showDeleteModal.value = false
  deleteId.value = null
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteId.value = null
}

// Barcode scanner integration: fill quick search and trigger search
let barcodeCtrl: ReturnType<typeof useBarcodeListener> | null = null
onMounted(() => {
  try {
    const settings: any = {
      windowMsMin: 0,
      interKeyTimeout: 300,
      minLength: 6,
      suffix: 'none',
      preventInInputs: true,
      forceFocus: false
    }
    barcodeCtrl = useBarcodeListener(settings)
    barcodeCtrl.onScan((code) => {
      localQ.value = code
      onSearch()
    })
    barcodeCtrl.start()
  } catch (err) {
    console.error('ArticleTable barcode init failed:', err)
  }
})

onBeforeUnmount(() => {
  barcodeCtrl?.stop()
})
</script>

<style scoped>
th { font-weight: 600; font-size: 0.9rem; }
</style>