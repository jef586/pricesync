<template>
  <BaseModal
    v-model="isOpen"
    :title="`Importar Lista de ${supplierName || 'Proveedor'}`"
    size="xl"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Paso 1: Subida y mapeo -->
      <div v-if="step === 1" class="space-y-6">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <div>
              <div class="text-sm font-medium text-blue-900 dark:text-blue-100">Formato admitido</div>
              <div class="text-xs text-blue-800 dark:text-blue-200">Archivos .xlsx o .csv. Encabezados libres, se mapearán columnas requeridas y opcionales.</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Archivo</label>
            <input
              type="file"
              accept=".xlsx,.csv"
              @change="onFileSelect"
              :disabled="processing"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            <div v-if="selectedFile" class="text-xs text-gray-600 dark:text-gray-300">
              {{ selectedFile.name }} — {{ formatSize(selectedFile.size) }}
            </div>
          </div>

          <div class="space-y-3">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Opciones de pricing</label>
            <div class="flex items-center gap-4">
              <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" v-model="applyOnImport" />
                <span>Calcular precio de venta</span>
              </label>
              <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" v-model="overwriteSalePrice" />
                <span>Reemplazar precio existente</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="availableHeaders.length" class="space-y-4">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-200">Mapeo de columnas</div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="field in mappingFields" :key="field.key" class="space-y-1">
              <label class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ field.label }}<span v-if="field.required" class="text-red-600">*</span></label>
              <BaseSelect :model-value="columnMapping[field.key] || ''" @update:modelValue="v => setMapping(field.key, v)" :error="mappingError(field.key)">
                <option value="">— Seleccionar columna —</option>
                <option v-for="h in availableHeaders" :key="h" :value="h">{{ h }}</option>
              </BaseSelect>
            </div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Requeridos: supplier_sku, name, cost_price. Opcionales: list_price, brand, category_name, tax_rate, unit.</div>
        </div>

        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="handleClose">Cancelar</BaseButton>
          <BaseButton :disabled="!canPreview || processing" variant="primary" @click="preview">
            {{ processing ? 'Procesando…' : 'Vista previa' }}
          </BaseButton>
        </div>
      </div>

      <!-- Paso 2: Vista previa -->
      <div v-else-if="step === 2" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Válidos" :value="validCount" variant="success" />
          <StatsCard title="Errores" :value="errorCount" variant="danger" />
          <StatsCard title="Dups SKU" :value="duplicateSkuCount" variant="warning" />
          <StatsCard title="IVA fuera rango" :value="vatOutOfRangeCount" variant="warning" />
        </div>

        <DataTable
          :data="previewRowsLimited"
          :columns="previewColumns"
          :paginated="false"
          :showHeader="true"
          rowKey="row"
        >
          <template #cell-status="{ item }">
            <BaseBadge :variant="item.hasErrors ? 'danger' : 'success'">{{ item.hasErrors ? 'Error' : 'Válido' }}</BaseBadge>
          </template>
          <template #cell-errors="{ item }">
            <div class="space-y-1">
              <div v-for="(e, idx) in item.errors" :key="idx" class="text-xs text-red-600 dark:text-red-400">{{ e }}</div>
              <div v-if="duplicateSkus.has(item.supplierCode)" class="text-xs text-yellow-700 dark:text-yellow-400">Duplicado supplier_sku</div>
              <div v-if="item.taxRateWarning" class="text-xs text-yellow-700 dark:text-yellow-400">IVA fuera de 0/10.5/21/27</div>
            </div>
          </template>
        </DataTable>
        <div v-if="previewData.length > 50" class="text-xs text-gray-500 dark:text-gray-400">Mostrando 50 de {{ previewData.length }} filas</div>

        <div class="flex justify-between">
          <BaseButton variant="secondary" @click="step = 1">Atrás</BaseButton>
          <div class="flex gap-2">
            <BaseButton variant="ghost" @click="handleClose">Cancelar</BaseButton>
            <BaseButton :disabled="importing || validCount === 0" variant="primary" @click="execute">
              {{ importing ? 'Importando…' : 'Importar' }}
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Paso 3: Resumen -->
      <div v-else class="space-y-4">
        <div class="text-center space-y-2">
          <svg class="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <div class="text-lg font-semibold">Importación completada</div>
          <div class="text-sm text-gray-600 dark:text-gray-300">Se guardó historial en listas de precios del proveedor</div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Creados" :value="results?.created || 0" variant="success" />
          <StatsCard title="Actualizados" :value="results?.updated || 0" variant="primary" />
          <StatsCard title="Omitidos" :value="results?.skipped || 0" variant="warning" />
          <StatsCard title="Errores" :value="(results?.errors?.length) || 0" variant="danger" />
        </div>

        <div class="flex justify-end">
          <BaseButton variant="primary" @click="handleClose">Cerrar</BaseButton>
        </div>
      </div>
    </div>

    <template #footer>
      <!-- Usamos footer del modal solo para mantener consistencia visual, acciones están dentro de cada paso -->
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import StatsCard from '@/components/atoms/StatsCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'
import * as XLSX from 'xlsx'

interface Props {
  modelValue: boolean
  supplierId: string
  supplierName?: string
}

interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref<boolean>(props.modelValue)
watch(() => props.modelValue, v => isOpen.value = v)
watch(isOpen, v => emit('update:modelValue', v))

const step = ref<number>(1)
const selectedFile = ref<File | null>(null)
const processing = ref<boolean>(false)
const importing = ref<boolean>(false)
const applyOnImport = ref<boolean>(true)
const overwriteSalePrice = ref<boolean>(false)

const availableHeaders = ref<string[]>([])
const columnMapping = ref<Record<string, string>>({})

const previewData = ref<any[]>([])
const results = ref<any | null>(null)

const auth = useAuthStore()
const { error, success } = useNotifications()

const mappingFields = [
  { key: 'supplier_sku', label: 'supplier_sku', required: true },
  { key: 'name', label: 'name', required: true },
  { key: 'cost_price', label: 'cost_price', required: true },
  { key: 'list_price', label: 'list_price', required: false },
  { key: 'brand', label: 'brand', required: false },
  { key: 'category_name', label: 'category_name', required: false },
  { key: 'tax_rate', label: 'tax_rate', required: false },
  { key: 'unit', label: 'unit', required: false }
]

function mappingError(key: string) {
  const field = mappingFields.find(f => f.key === key)
  if (!field) return false
  if (!field.required) return false
  return !(columnMapping.value[key])
}

const canPreview = computed(() => {
  if (!selectedFile.value) return false
  return mappingFields.filter(f => f.required).every(f => !!columnMapping.value[f.key])
})

function handleClose() {
  isOpen.value = false
  emit('close')
}

function formatSize(bytes: number) {
  const k = 1024; const sizes = ['Bytes','KB','MB','GB']; const i = Math.floor(Math.log(bytes)/Math.log(k));
  return `${(bytes/Math.pow(k,i)).toFixed(2)} ${sizes[i]}`
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] || null
  selectedFile.value = file
  availableHeaders.value = []
  columnMapping.value = {}
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = reader.result as ArrayBuffer
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheetName = wb.SheetNames[0]
      const ws = wb.Sheets[firstSheetName]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
      const headers = (rows[0] || []).map(h => String(h).trim())
      availableHeaders.value = headers
      autoMap(headers)
    } catch (err: any) {
      error('Archivo inválido', err?.message || 'No se pudo leer el archivo')
    }
  }
  reader.onerror = () => {
    error('Lectura de archivo', 'No se pudo leer el archivo seleccionado')
  }
  reader.readAsArrayBuffer(file)
}

function autoMap(headers: string[]) {
  const match = (target: string) => headers.find(h => h.toLowerCase().includes(target.toLowerCase())) || ''
  columnMapping.value = {
    supplier_sku: match('sku') || match('código proveedor') || match('codigo proveedor') || match('code'),
    name: match('nombre') || match('producto') || match('name'),
    cost_price: match('costo') || match('precio costo') || match('cost'),
    list_price: match('lista') || match('precio lista') || match('list'),
    brand: match('marca') || match('brand'),
    category_name: match('rubro') || match('categoría') || match('categoria') || match('category'),
    tax_rate: match('iva') || match('tax'),
    unit: match('unidad') || match('unit')
  }
}

async function preview() {
  if (!selectedFile.value) return
  processing.value = true
  try {
    const form = new FormData()
    form.append('file', selectedFile.value)
    form.append('mapping', JSON.stringify(columnMapping.value))
    form.append('applyOnImport', String(applyOnImport.value))
    form.append('overwriteSalePrice', String(overwriteSalePrice.value))

    const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/suppliers/${props.supplierId}/products/import/preview`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth.token}` },
      body: form
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error || 'Error procesando la vista previa')
    }
    const data = await resp.json()
    previewData.value = (data.preview || []).map((r: any) => ({
      ...r,
      taxRateWarning: checkVat(r.taxRate)
    }))
    step.value = 2
    success('Vista previa lista')
  } catch (err: any) {
    error('Falló la vista previa', err?.message || 'Error desconocido')
  } finally {
    processing.value = false
  }
}

async function execute() {
  if (!selectedFile.value) return
  importing.value = true
  try {
    const form = new FormData()
    form.append('file', selectedFile.value)
    form.append('mapping', JSON.stringify(columnMapping.value))
    form.append('applyOnImport', String(applyOnImport.value))
    form.append('overwriteSalePrice', String(overwriteSalePrice.value))
    form.append('updateExisting', 'true')

    const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/suppliers/${props.supplierId}/products/import/execute`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth.token}` },
      body: form
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error || 'Error ejecutando importación')
    }
    const data = await resp.json()
    results.value = data.results || data
    step.value = 3
    emit('success')
    success('Importación completada')
  } catch (err: any) {
    error('Falló la importación', err?.message || 'Error desconocido')
  } finally {
    importing.value = false
  }
}

function checkVat(v: any): boolean {
  if (v == null || v === '') return false
  const n = Number(v)
  return ![0, 10.5, 21, 27].includes(Number.isFinite(n) ? Number(n.toFixed(1)) : NaN)
}

const duplicateSkus = computed(() => {
  const counts = new Map<string, number>()
  for (const row of previewData.value) {
    const code = String(row.supplierCode || '').trim()
    if (!code) continue
    counts.set(code, (counts.get(code) || 0) + 1)
  }
  return new Set([...counts.entries()].filter(([_, c]) => c > 1).map(([k]) => k))
})

const duplicateSkuCount = computed(() => duplicateSkus.value.size)
const vatOutOfRangeCount = computed(() => previewData.value.filter(r => r.taxRateWarning).length)
const validCount = computed(() => previewData.value.filter(r => !r.hasErrors).length)
const errorCount = computed(() => previewData.value.filter(r => r.hasErrors).length)

const previewRowsLimited = computed(() => previewData.value.slice(0, 50))

const previewColumns = [
  { key: 'status', label: 'Estado' },
  { key: 'supplierCode', label: 'supplier_sku' },
  { key: 'supplierName', label: 'name' },
  { key: 'costPrice', label: 'cost_price' },
  { key: 'listPrice', label: 'list_price' },
  { key: 'brand', label: 'brand' },
  { key: 'categoryName', label: 'category_name' },
  { key: 'taxRate', label: 'tax_rate' },
  { key: 'unit', label: 'unit' },
  { key: 'computedSalePrice', label: 'precio_sugerido' },
  { key: 'errors', label: 'Errores' }
]
</script>

<style scoped>
.space-y-6 > * + * { margin-top: 1.5rem; }
</style>
