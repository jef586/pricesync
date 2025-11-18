<template>
  <BaseModal v-model="isOpen" :title="`Importar Lista de ${supplierName || 'Proveedor'}`" size="xl" @close="handleClose">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-300">Paso {{ step }} de 4</div>
      </div>

      <div v-if="step === 1" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Archivo</label>
            <input type="file" accept=".xlsx,.xls,.csv" @change="onFileSelect" :disabled="processing" class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" />
            <div v-if="fileMeta" class="text-xs text-gray-600 dark:text-gray-300">{{ fileMeta.name }} — {{ formatSize(fileMeta.size) }}</div>
          </div>
          <div class="space-y-3">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Fila de encabezados</label>
            <BaseInput :model-value="String(headerRow)" type="number" min="1" @update:modelValue="v => setHeaderRow(Number(v))" />
            <div class="text-xs text-gray-500">Selecciona la fila donde están los nombres de columna</div>
          </div>
        </div>

        <div v-if="rawPreview.length" class="space-y-3">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-200">Preview cruda (30 filas)</div>
          <DataTable :columns="rawColumns" :data="rawData" :paginated="false" :showHeader="true" rowKey="row" />
        </div>

        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="handleClose">Cancelar</BaseButton>
          <BaseButton :disabled="!canProceedToMapping || processing" variant="primary" @click="buildHeaders">Usar encabezados</BaseButton>
        </div>
      </div>

      <div v-else-if="step === 2" class="space-y-6">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-200">Mapeo de columnas</div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="field in mappingFields" :key="field.key" class="space-y-1">
            <label class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ field.label }}<span v-if="field.required" class="text-red-600">*</span></label>
            <BaseSelect :model-value="mapping[field.key] || ''" :placeholder="'— Seleccionar columna —'" @update:modelValue="v => setMapping(field.key, v)" :error="mappingError(field.key)">
              <option v-for="h in availableHeaders" :key="h" :value="h">{{ h }}</option>
            </BaseSelect>
          </div>
        </div>
        <div v-if="availableHeaders.length === 0" class="text-xs text-yellow-700 dark:text-yellow-400">No se detectaron encabezados. Vuelve al Paso 1 y ajusta “Fila de encabezados”.</div>
        <div class="flex justify-between">
          <BaseButton variant="secondary" @click="step = 1">Atrás</BaseButton>
          <BaseButton :disabled="!canPreview || processing" variant="primary" @click="toTransform">Siguiente</BaseButton>
        </div>
      </div>

      <div v-else-if="step === 3" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Costo incluye IVA</label>
            <div class="flex items-center gap-2"><input type="checkbox" v-model="transform.costPriceIncludesVat" @change="onTransformChange" /><span class="text-sm">Incluir IVA</span></div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Moneda</label>
            <BaseSelect :model-value="transform.currency" @update:modelValue="v => setCurrency(v as any)">
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </BaseSelect>
          </div>
          <div v-if="transform.currency === 'USD'">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Tasa USD→ARS</label>
            <BaseInput :model-value="String(transform.usdRate || 0)" type="number" min="0" step="0.01" @update:modelValue="v => setUsdRate(Number(v))" />
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Válidos" :value="validCount" variant="success" />
          <StatsCard title="Errores" :value="errorCount" variant="danger" />
          <StatsCard title="Dups SKU" :value="duplicateSkuCount" variant="warning" />
          <StatsCard title="IVA fuera rango" :value="vatOutOfRangeCount" variant="warning" />
        </div>

        <DataTable :columns="normalizedColumns" :data="normalizedPreviewLimited" :paginated="false" :showHeader="true" rowKey="row" />
        <div v-if="normalizedPreview.length > 50" class="text-xs text-gray-500 dark:text-gray-400">Mostrando 50 de {{ normalizedPreview.length }} filas</div>

        <div class="flex justify-between">
          <BaseButton variant="secondary" @click="step = 2">Atrás</BaseButton>
          <BaseButton :disabled="importing || validCount === 0" variant="primary" @click="execute">Importar</BaseButton>
        </div>
      </div>

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
        <div class="flex justify-end"><BaseButton variant="primary" @click="handleClose">Cerrar</BaseButton></div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import * as XLSX from 'xlsx'
import BaseModal from '@/components/atoms/BaseModal.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import DataTable from '@/components/atoms/DataTable.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import StatsCard from '@/components/atoms/StatsCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'
import { useSupplierImportStore } from '@/stores/supplierImport'
import { autoMapHeaders, validateRow } from '@/utils/supplierImport'

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
const processing = ref<boolean>(false)
const importing = ref<boolean>(false)
interface ImportResults { created: number; updated: number; skipped: number; errors: { row: number; error: string }[] }
const results = ref<ImportResults | null>(null)

const store = useSupplierImportStore()
store.setSupplier(props.supplierId)

const headerRow = computed(() => store.headerRow)
const availableHeaders = computed(() => store.availableHeaders)
const mapping = computed(() => store.mapping)
const transform = computed(() => store.transformConfig)

const applyOnImport = computed({ get: () => store.options.applyOnImport, set: v => store.setOptions({ applyOnImport: v }) })
const overwriteSalePrice = computed({ get: () => store.options.overwriteSalePrice, set: v => store.setOptions({ overwriteSalePrice: v }) })

const rawPreview = ref<string[][]>([])
const rawColumns = computed(() => {
  const maxLen = rawPreview.value.reduce((m, r) => Math.max(m, r.length), 0)
  const cols = Array.from({ length: maxLen }).map((_, i) => ({ key: `col${i+1}`, label: `Col ${i+1}` }))
  return [{ key: 'row', label: '#' }, ...cols]
})
const rawData = computed(() => rawPreview.value.map((r, idx) => {
  const obj: Record<string, string | number> = { row: idx + 1 }
  r.forEach((v, i) => { obj[`col${i+1}`] = v })
  return obj
}))

const fileMeta = computed(() => store.fileName ? { name: store.fileName, size: store.fileSize || 0 } : null)

const auth = useAuthStore()
const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:3002'
const API_BASE = RAW_API.endsWith('/api') ? RAW_API : `${RAW_API}/api`
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

function formatSize(bytes: number) {
  const k = 1024; const sizes = ['Bytes','KB','MB','GB']; const i = Math.floor(Math.log(bytes)/Math.log(k));
  return `${(bytes/Math.pow(k,i)).toFixed(2)} ${sizes[i]}`
}

function setHeaderRow(n: number) {
  store.setHeaderRow(n)
}

function setMapping(k: string, v: string) {
  store.setMapping(k, v)
}

function mappingError(key: string) {
  const field = mappingFields.find(f => f.key === key)
  if (!field || !field.required) return ''
  return mapping.value[key] ? '' : 'Campo requerido'
}

const canProceedToMapping = computed(() => !!fileMeta.value)
const canPreview = computed(() => mappingFields.filter(f => f.required).every(f => !!mapping.value[f.key]))

let selectedFile: File | null = null

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] || null
  selectedFile = file
  store.setFileMeta(file?.name || null, file?.size || null)
  rawPreview.value = []
  store.setHeaders([])
  store.mapping = {}
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = reader.result as ArrayBuffer
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheetName = wb.SheetNames[0]
      const ws = wb.Sheets[firstSheetName]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
      rawPreview.value = rows.slice(0, 30).map(r => r.map(v => String(v ?? '')))
    } catch (err: any) {
      error('Archivo inválido', err?.message || 'No se pudo leer el archivo')
    }
  }
  reader.onerror = () => { error('Lectura de archivo', 'No se pudo leer el archivo seleccionado') }
  reader.readAsArrayBuffer(file)
}

function buildHeaders() {
  if (!rawPreview.value.length) return
  const idx = Math.max(1, headerRow.value) - 1
  const headers = (rawPreview.value[idx] || []).map(h => String(h).trim()).filter(h => !!h)
  store.setHeaders(headers)
  const auto = autoMapHeaders(headers)
  store.mapping = auto
  store.saveConfig()
  step.value = 2
}

function toTransform() {
  step.value = 3
  previewNormalized()
}

function setCurrency(v: 'ARS' | 'USD') {
  store.setTransformConfig({ currency: v })
  previewNormalized()
}

function setUsdRate(v: number) {
  store.setTransformConfig({ usdRate: v })
  previewNormalized()
}

function onTransformChange() {
  store.setTransformConfig({ costPriceIncludesVat: transform.value.costPriceIncludesVat })
  previewNormalized()
}

interface PreviewRowNormalized {
  row: number
  supplierCode: string
  supplierName: string
  costPrice: number | string
  listPrice?: number | string
  brand?: string
  categoryName?: string
  taxRate?: number | string
  unit?: string
  computedSalePrice?: number
  costPriceNormalized?: number
  errors: string[]
  hasErrors: boolean
  taxRateWarning?: boolean
}
const normalizedPreview = ref<PreviewRowNormalized[]>([])
const normalizedColumns = [
  { key: 'status', label: 'Estado' },
  { key: 'supplierCode', label: 'supplier_sku' },
  { key: 'supplierName', label: 'name' },
  { key: 'costPrice', label: 'cost_price' },
  { key: 'costPriceNormalized', label: 'cost_price_normalized' },
  { key: 'listPrice', label: 'list_price' },
  { key: 'brand', label: 'brand' },
  { key: 'categoryName', label: 'category_name' },
  { key: 'taxRate', label: 'tax_rate' },
  { key: 'unit', label: 'unit' },
  { key: 'computedSalePrice', label: 'precio_sugerido' },
  { key: 'errors', label: 'Errores' }
]

const normalizedPreviewLimited = computed(() => normalizedPreview.value.slice(0, 50))

const duplicateSkus = computed(() => {
  const counts = new Map<string, number>()
  for (const row of normalizedPreview.value) {
    const code = String(row.supplierCode || '').trim()
    if (!code) continue
    counts.set(code, (counts.get(code) || 0) + 1)
  }
  return new Set([...counts.entries()].filter(([_, c]) => c > 1).map(([k]) => k))
})

const duplicateSkuCount = computed(() => duplicateSkus.value.size)
const vatOutOfRangeCount = computed(() => normalizedPreview.value.filter(r => r.taxRateWarning).length)
const validCount = computed(() => normalizedPreview.value.filter(r => !r.hasErrors).length)
const errorCount = computed(() => normalizedPreview.value.filter(r => r.hasErrors).length)

async function previewNormalized() {
  if (!selectedFile) return
  processing.value = true
  try {
    const form = new FormData()
    form.append('file', selectedFile)
    form.append('mapping', JSON.stringify(mapping.value))
    form.append('applyOnImport', String(applyOnImport.value))
    form.append('overwriteSalePrice', String(overwriteSalePrice.value))
    form.append('headerRow', String(headerRow.value))
    form.append('transformConfig', JSON.stringify(transform.value))

    const resp = await fetch(`${API_BASE}/suppliers/${props.supplierId}/products/import/preview`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth.token}` },
      body: form
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err.error || 'Error procesando la vista previa')
    }
    const data = await resp.json()
    normalizedPreview.value = (data.preview || []).map((r: any) => ({
      ...r,
      taxRateWarning: (() => {
        const v = Number(r.taxRate)
        const ok = [0, 10.5, 21, 27].some(x => Math.abs(x - v) < 0.0001)
        return !ok
      })()
    }))
    success('Vista previa lista')
  } catch (err: any) {
    error('Falló la vista previa', err?.message || 'Error desconocido')
  } finally {
    processing.value = false
  }
}

async function execute() {
  if (!selectedFile) return
  importing.value = true
  try {
    const form = new FormData()
    form.append('file', selectedFile)
    form.append('mapping', JSON.stringify(mapping.value))
    form.append('applyOnImport', String(applyOnImport.value))
    form.append('overwriteSalePrice', String(overwriteSalePrice.value))
    form.append('updateExisting', 'true')
    form.append('headerRow', String(headerRow.value))
    form.append('transformConfig', JSON.stringify(transform.value))

    const resp = await fetch(`${API_BASE}/suppliers/${props.supplierId}/products/import/execute`, {
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
    store.saveConfig()
    step.value = 4
    emit('success')
    success('Importación completada')
  } catch (err: any) {
    error('Falló la importación', err?.message || 'Error desconocido')
  } finally {
    importing.value = false
  }
}

function handleClose() {
  isOpen.value = false
  emit('close')
}
</script>

<style scoped>
.space-y-6 > * + * { margin-top: 1.5rem; }
</style>
