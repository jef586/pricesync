<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-6 md:top-10 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-900">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Importar artículos desde proveedor</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Seleccionar proveedor</label>
              <BaseSelect :model-value="selectedSupplierId || ''" placeholder="Proveedor" @update:modelValue="v => selectSupplier(String(v || ''))">
                <option v-for="opt in supplierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </BaseSelect>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Se listan productos previamente importados del proveedor.</div>
            </div>
            <div class="flex items-end justify-end">
              <label class="inline-flex items-center">
                <input type="checkbox" v-model="applyPricing" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span class="ml-2 text-sm">Aplicar pricing al crear</span>
              </label>
            </div>
          </div>

          <div v-if="loadingProducts" class="p-4 text-sm text-gray-600">Cargando productos del proveedor…</div>
          <div v-else-if="selectedSupplierId && supplierProducts.length === 0" class="p-4 text-sm text-gray-600">El proveedor no tiene productos importados. Ve al módulo Proveedores para procesar su lista.</div>

          <div v-if="supplierProducts.length">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm text-gray-700 dark:text-gray-300">{{ selectedCount }} seleccionados de {{ supplierProducts.length }}</div>
              <div class="flex items-center gap-2">
                <button class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded" @click="toggleSelectAll(true)">Seleccionar todos</button>
                <button class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded" @click="toggleSelectAll(false)">Limpiar selección</button>
              </div>
            </div>

            <div class="max-h-96 overflow-y-auto border dark:border-gray-700 rounded">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th class="px-3 py-2"><input type="checkbox" :checked="allSelected" @change="toggleSelectAll(($event.target as HTMLInputElement).checked)" /></th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Código</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Nombre</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Costo</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Lista</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Precio sugerido</th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="row in supplierProducts" :key="row.id">
                    <td class="px-3 py-2"><input type="checkbox" :checked="selectedIds.has(row.id)" @change="toggleSelect(row.id, ($event.target as HTMLInputElement).checked)" /></td>
                    <td class="px-3 py-2 text-sm font-mono">{{ row.supplierCode }}</td>
                    <td class="px-3 py-2 text-sm">{{ row.supplierName }}</td>
                    <td class="px-3 py-2 text-right text-sm">{{ formatMoney(row.costPrice) }}</td>
                    <td class="px-3 py-2 text-right text-sm">{{ formatMoney(row.listPrice) }}</td>
                    <td class="px-3 py-2 text-right text-sm">{{ previewPrice(row) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <div></div>
            <div class="flex gap-2">
              <button @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              <button @click="createSelected" :disabled="isSubmitting || selectedCount === 0" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">{{ isSubmitting ? 'Creando…' : 'Importar artículos' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import { useSuppliers } from '@/composables/useSuppliers'
import { useNotifications } from '@/composables/useNotifications'
import { getPricingSettings, computePreviewSale } from '@/services/settingsService'
import { apiClient } from '@/services/api'
import { createArticle, addArticleSupplierLink } from '@/services/articles'

interface Emits {
  (e: 'close'): void
  (e: 'success', results: { created: number; updated: number; skipped: number }): void
}

const emit = defineEmits<Emits>()
const { suppliers, fetchSuppliers } = useSuppliers()
const { success, error } = useNotifications()

const selectedSupplierId = ref<string | null>(null)
const supplierOptions = computed(() => suppliers.value.map((s: any) => ({ value: s.id, label: `${s.name} (${s.code || '—'})` })))
const supplierProducts = ref<any[]>([])
const loadingProducts = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const applyPricing = ref(true)
const pricingSettings = ref<any | null>(null)
const isSubmitting = ref(false)

onMounted(async () => {
  await fetchSuppliers({ limit: 200 })
  try { pricingSettings.value = await getPricingSettings() } catch {}
})

function selectSupplier(id: string) {
  selectedSupplierId.value = id || null
}

watch(selectedSupplierId, async (sid) => {
  supplierProducts.value = []
  selectedIds.value = new Set()
  if (!sid) return
  loadingProducts.value = true
  try {
    const res = await apiClient.get(`/suppliers/${sid}/products?limit=100`)
    const data = res.data?.products || res.data?.data || []
    supplierProducts.value = data
  } catch (e: any) {
    error('Error al cargar productos', e?.message)
  } finally {
    loadingProducts.value = false
  }
})

const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => supplierProducts.value.length > 0 && selectedCount.value === supplierProducts.value.length)

function toggleSelect(id: string, checked: boolean) {
  const set = new Set(selectedIds.value)
  if (checked) set.add(id)
  else set.delete(id)
  selectedIds.value = set
}

function toggleSelectAll(checked: boolean) {
  if (!checked) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(supplierProducts.value.map((r) => r.id))
  }
}

function formatMoney(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(n) || 0)
}

function previewPrice(row: any): string {
  if (!applyPricing.value || !pricingSettings.value) return '—'
  const v = computePreviewSale(Number(row.costPrice || 0), row.listPrice != null ? Number(row.listPrice) : null, pricingSettings.value, selectedSupplierId.value || undefined)
  return formatMoney(v)
}

async function createSelected() {
  if (!selectedSupplierId.value) { error('Seleccione un proveedor'); return }
  isSubmitting.value = true
  const sid = selectedSupplierId.value
  let created = 0, updated = 0, skipped = 0
  try {
    for (const row of supplierProducts.value) {
      if (!selectedIds.value.has(row.id)) continue
      try {
        const payload: any = {
          name: row.supplierName || row.description || row.supplierCode,
          type: 'PRODUCT',
          active: true,
          sku: row.supplierCode || undefined,
          cost: Number(row.costPrice || 0),
          taxRate: 21,
        }
        if (applyPricing.value && pricingSettings.value) {
          payload.pricePublic = computePreviewSale(Number(row.costPrice || 0), row.listPrice != null ? Number(row.listPrice) : null, pricingSettings.value, sid)
        }
        const article = await createArticle(payload)
        await addArticleSupplierLink(article.id, sid, { supplierSku: row.supplierCode, isPrimary: true })
        created++
      } catch (e: any) {
        console.error('Error creando artículo desde proveedor', e)
        skipped++
      }
    }
    success(`Importación completada: ${created} creados, ${updated} actualizados, ${skipped} omitidos`)
    emit('success', { created, updated, skipped })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
</style>
