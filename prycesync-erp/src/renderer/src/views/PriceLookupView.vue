<template>
  <DashboardLayout>
    <div class="price-lookup-view">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Consulta de Precios</h1>
          <p class="text-gray-600 dark:text-gray-300">Escanee un código de barras, ingrese SKU o nombre</p>
        </div>
        <div class="text-sm text-gray-500">
          Atajo: <span class="font-mono">F9</span>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-3 sm:p-4 mb-6 max-w-3xl mx-auto">
        <div class="flex flex-wrap items-end gap-3">
          <div class="w-40 sm:w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Modo</label>
            <select v-model="mode" class="mt-1 w-full h-10 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100">
              <option value="barcode">Cód.Barras</option>
              <option value="internal">Cód.Interno</option>
              <option value="supplier">Cód.Proveedor</option>
              <option value="name">Nombre</option>
            </select>
          </div>
          <div class="flex-1 min-w-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">{{ inputLabel }}</label>
            <input
              v-model="term"
              @keydown.enter.prevent="handleSearch"
              type="text"
              class="mt-1 w-full h-10 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              :placeholder="placeholder"
            />
          </div>
          <div v-if="mode === 'supplier'" class="w-full sm:w-64">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Proveedor</label>
            <div class="relative">
              <input
                v-model="supplierQuery"
                type="text"
                class="mt-1 w-full h-10 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Buscar proveedor por nombre o código"
              />
              <div v-if="showSupplierDropdown" class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow max-h-40 overflow-auto">
                <button
                  v-for="s in supplierResults"
                  :key="s.id"
                  type="button"
                  class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                  @click="selectSupplier(s)"
                >
                  <span class="font-medium">{{ s.name }}</span>
                  <span class="ml-2 text-xs text-gray-500">{{ s.code || '—' }}</span>
                </button>
              </div>
            </div>
            <p v-if="selectedSupplier" class="mt-1 text-xs text-gray-500">Seleccionado: {{ selectedSupplier.name }} ({{ selectedSupplier.code || '—' }})</p>
          </div>
          <div class="flex gap-3">
            <button
              @click="handleSearch"
              class="inline-flex items-center px-4 h-10 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Buscar
            </button>
            <button
              @click="clear"
              class="inline-flex items-center px-4 h-10 border rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
            >
              Limpiar
            </button>
          </div>
        </div>
        <p v-if="hint" class="mt-2 text-xs text-gray-500">{{ hint }}</p>
      </div>

      <div v-if="loading" class="text-gray-600 dark:text-gray-300 max-w-5xl mx-auto">Buscando...</div>

      <div v-if="result && !loading" class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 max-w-5xl mx-auto">
        <div class="flex gap-6 items-start">
          <img v-if="result.imageUrl" :src="result.imageUrl" alt="Imagen" class="w-28 h-28 object-cover rounded" />
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ result.name }}</h2>
                <p class="text-xs text-gray-500">SKU: {{ result.sku || '—' }} | EAN: {{ result.barcode || (result.barcodes?.[0]?.code || '—') }}</p>
                <p class="text-xs text-gray-500">Categoría: {{ result.category?.name || result.categoryName || '—' }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">Stock</p>
                <p :class="[isLowStock(result) ? 'text-red-600 font-semibold' : 'text-gray-900']">{{ (result.stock ?? 0) }}</p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Precio Público</h3>
                <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(publicPrice) }}</p>
                <p v-if="result.pricePublic != null && publicPrice !== result.pricePublic" class="text-xs text-gray-500 mt-1">
                  Precio base: {{ formatCurrency(result.pricePublic) }}
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Desglose</h3>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between"><span>Neto (sin IVA)</span><span>{{ formatCurrency(breakdown.netBeforeVat) }}</span></div>
                  <div class="flex justify-between"><span>Impuesto Interno</span><span>{{ formatCurrency(breakdown.internalTaxAmount) }}</span></div>
                  <div class="flex justify-between"><span>IVA</span><span>{{ formatCurrency(breakdown.vatAmount) }}</span></div>
                </div>
              </div>
            </div>

            <div v-if="result.canSeeCost" class="mt-6">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Costos</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><span class="text-gray-500">Costo</span><div class="font-medium">{{ formatCurrency(inputs.cost) }}</div></div>
                <div><span class="text-gray-500">Margen</span><div class="font-medium">{{ (inputs.margin ?? 0).toFixed(2) }}%</div></div>
                <div><span class="text-gray-500">IVA</span><div class="font-medium">{{ (inputs.vat ?? 0).toFixed(2) }}%</div></div>
                <div><span class="text-gray-500">Imp. Interno</span><div class="font-medium">{{ (inputs.internalTax ?? 0).toFixed(2) }}%</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!loading && tried" class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 max-w-5xl mx-auto">
        <p class="text-gray-600 dark:text-gray-300">No se encontró el artículo.</p>
      </div>
    </div>
  </DashboardLayout>
  
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import { lookup } from '@/services/articles'
import reportsService from '@/services/reportsService'
import { useSuppliers } from '@/composables/useSuppliers'

const term = ref('')
const loading = ref(false)
const result = ref<any | null>(null)
const tried = ref(false)
const hint = ref('')

// Modo de búsqueda: barcode | internal | supplier | name
const mode = ref<'barcode' | 'internal' | 'supplier' | 'name'>('barcode')
const inputLabel = computed(() => {
  switch (mode.value) {
    case 'barcode': return 'Código de barras'
    case 'internal': return 'Código interno (SKU)'
    case 'supplier': return 'Código de proveedor'
    case 'name': return 'Nombre del artículo'
  }
})
const placeholder = computed(() => {
  switch (mode.value) {
    case 'barcode': return 'EAN13, UPC, etc.'
    case 'internal': return 'SKU interno (ej. ABC-123)'
    case 'supplier': return 'Código asignado por el proveedor'
    case 'name': return 'Nombre o parte del nombre'
  }
})

// Autocomplete de proveedor (solo en modo supplier)
const { searchSuppliers } = useSuppliers()
const supplierQuery = ref('')
const supplierResults = ref<any[]>([])
const selectedSupplier = ref<any | null>(null)
const showSupplierDropdown = computed(() => mode.value === 'supplier' && supplierQuery.value.length >= 2 && supplierResults.value.length > 0)

watch(supplierQuery, async (q) => {
  if (mode.value !== 'supplier') return
  if (!q || q.trim().length < 2) {
    supplierResults.value = []
    return
  }
  try {
    supplierResults.value = await searchSuppliers(q.trim())
  } catch {
    supplierResults.value = []
  }
})

function selectSupplier(s: any) {
  selectedSupplier.value = s
  supplierQuery.value = `${s.name}`
  supplierResults.value = []
}

function buildParams() {
  const s = term.value.trim()
  if (!s) return {}
  if (mode.value === 'barcode') return { barcode: s }
  if (mode.value === 'internal') return { sku: s }
  if (mode.value === 'name') return { q: s }
  if (mode.value === 'supplier') {
    const supplierId = selectedSupplier.value?.id
    return supplierId ? { supplierId, supplierSku: s } : {}
  }
  return { q: s }
}

async function handleSearch() {
  tried.value = true
  result.value = null
  hint.value = ''
  const params = buildParams()
  if (mode.value === 'supplier' && !params.supplierId) {
    hint.value = 'Seleccione un proveedor para buscar por código de proveedor.'
    return
  }
  loading.value = true
  try {
    const data = await lookup(params as any)
    result.value = data
    if (!data) hint.value = 'Pruebe con otro término o verifique el código.'
  } finally {
    loading.value = false
  }
}

function clear() {
  term.value = ''
  supplierQuery.value = ''
  supplierResults.value = []
  selectedSupplier.value = null
  result.value = null
  tried.value = false
  hint.value = ''
}

function isLowStock(item: any) {
  if (item?.stock == null || item?.stockMin == null) return false
  return Number(item.stock) <= Number(item.stockMin)
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return '—'
  return reportsService.formatCurrency(Number(n))
}

const breakdown = computed(() => {
  const b = (result.value?.pricingBreakdown || {})
  return {
    netBeforeVat: Number(b.netBeforeVat || 0),
    internalTaxAmount: Number(b.internalTaxAmount || 0),
    vatAmount: Number(b.vatAmount || 0)
  }
})

const inputs = computed(() => {
  const i = (result.value?.pricingInputs || {})
  return {
    cost: Number(i.cost ?? result.value?.costPrice ?? 0),
    margin: Number(i.margin ?? result.value?.margin ?? 0),
    vat: Number(i.vat ?? result.value?.vat ?? 0),
    internalTax: Number(i.internalTax ?? result.value?.internalTax ?? 0)
  }
})

const publicPrice = computed(() => {
  const fromBreakdown = Number(result.value?.pricingBreakdown?.publicPrice ?? 0)
  if (fromBreakdown > 0) return fromBreakdown
  return Number(result.value?.pricePublic ?? result.value?.salePrice ?? 0)
})
</script>

<style scoped>
.price-lookup-view {}
</style>