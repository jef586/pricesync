<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-6 md:top-10 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-900">
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {{ modalTitle }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Steps -->
        <div class="mb-12 px-6 md:px-12">
          <div class="flex items-center">
            <div class="flex items-center text-blue-600 dark:text-blue-400 relative">
              <div class="flex items-center justify-center rounded-full transition duration-500 ease-in-out h-12 w-12 border-2 border-blue-600 bg-blue-600 text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div class="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium uppercase text-blue-600 dark:text-blue-400">
                Subir Archivo
              </div>
            </div>
            <div class="flex-auto border-t-2 transition duration-500 ease-in-out" :class="currentStep >= 2 ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'"></div>
            <div class="flex items-center relative" :class="currentStep >= 2 ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'">
              <div class="flex items-center justify-center rounded-full transition duration-500 ease-in-out h-12 w-12 border-2" 
                   :class="currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div class="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium uppercase text-gray-600 dark:text-gray-300">
                Vista Previa
              </div>
            </div>
            <div class="flex-auto border-t-2 transition duration-500 ease-in-out" :class="currentStep >= 3 ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'"></div>
            <div class="flex items-center relative" :class="currentStep >= 3 ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'">
              <div class="flex items-center justify-center rounded-full transition duration-500 ease-in-out h-12 w-12 border-2"
                   :class="currentStep >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium uppercase text-gray-600 dark:text-gray-300">
                Completado
              </div>
            </div>
          </div>
        </div>

        <!-- Step 1: File Upload -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div v-if="type === 'suppliers'" class="mt-10 md:mt-12 space-y-3">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Proveedor destino</label>
            <BaseSelect :model-value="selectedSupplierId || ''" placeholder="Seleccionar proveedor" @update:modelValue="v => selectedSupplierId = (v || null)">
              <option v-for="opt in supplierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </BaseSelect>
            <div class="text-xs text-gray-500 dark:text-gray-400">Necesario para vincular los productos importados.</div>
          </div>
          <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800 dark:text-blue-100">
                  Formato del archivo Excel
                </h3>
                <div class="mt-2 text-sm text-blue-700 dark:text-blue-200">
                  <p>{{ formatInstructions }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Columnas requeridas:</h4>
            <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li v-for="column in requiredColumns" :key="column">
                <strong>{{ column.name }}:</strong> {{ column.description }}
              </li>
            </ul>
          </div>

          <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div class="mt-4">
                <label for="file-upload" class="cursor-pointer">
                  <span class="mt-2 block text-sm font-medium text-gray-900">
                    Selecciona un archivo Excel
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    @change="handleFileSelect"
                    class="sr-only"
                  />
                </label>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Archivos Excel (.xlsx, .xls) hasta 10MB
                </p>
              </div>
            </div>
          </div>

          <div v-if="selectedFile" class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="text-sm text-blue-900 dark:text-blue-100">{{ selectedFile.name }}</span>
              <span class="text-xs text-blue-700 dark:text-blue-200 ml-2">({{ formatFileSize(selectedFile.size) }})</span>
            </div>
          </div>
        </div>

        <!-- Step 2: Preview -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 rounded-lg" :class="{'bg-green-50 dark:bg-green-900/20': true}">
              <div class="text-sm font-medium text-green-900 dark:text-green-200">Registros válidos</div>
              <div class="text-2xl font-bold text-green-600 dark:text-green-300">{{ validRecords }}</div>
            </div>
            <div class="p-3 rounded-lg" :class="{'bg-red-50 dark:bg-red-900/20': true}">
              <div class="text-sm font-medium text-red-900 dark:text-red-200">Registros con errores</div>
              <div class="text-2xl font-bold text-red-600 dark:text-red-300">{{ errorRecords }}</div>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="max-h-96 overflow-y-auto border dark:border-gray-700 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                  <th v-for="column in previewColumns" :key="column.key" 
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    {{ column.label }}
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Errores</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(record, index) in previewData.slice(0, 50)" :key="index"
                    :class="record.hasErrors ? 'bg-red-50' : 'bg-green-50'">
                  <td class="px-3 py-2 text-sm">
                    <span v-if="record.hasErrors" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Error
                    </span>
                    <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Válido
                    </span>
                  </td>
                  <td v-for="column in previewColumns" :key="column.key" 
                      class="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {{ record[column.key] }}
                  </td>
                  <td class="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                    <div v-if="record.hasErrors">
                      <div v-for="error in record.errors" :key="error" class="text-xs">{{ error }}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="previewData.length > 50" class="text-sm text-gray-500 text-center">
            Mostrando los primeros 50 registros de {{ previewData.length }} total
          </div>
        </div>

        <!-- Step 3: Results -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">¡Importación completada!</h3>
            <p class="mt-1 text-sm text-gray-500">Los datos se han importado exitosamente</p>
          </div>

          <div v-if="importResults" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-green-50 p-3 rounded-lg text-center">
              <div class="text-sm font-medium text-green-900">Creados</div>
              <div class="text-2xl font-bold text-green-600">{{ importResults.created || 0 }}</div>
            </div>
            <div class="bg-blue-50 p-3 rounded-lg text-center">
              <div class="text-sm font-medium text-blue-900">Actualizados</div>
              <div class="text-2xl font-bold text-blue-600">{{ importResults.updated || 0 }}</div>
            </div>
            <div class="bg-yellow-50 p-3 rounded-lg text-center">
              <div class="text-sm font-medium text-yellow-900">Omitidos</div>
              <div class="text-2xl font-bold text-yellow-600">{{ importResults.skipped || 0 }}</div>
            </div>
            <div class="bg-red-50 p-3 rounded-lg text-center">
              <div class="text-sm font-medium text-red-900">Errores</div>
              <div class="text-2xl font-bold text-red-600">{{ importResults.errors?.length || 0 }}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-between mt-6">
          <div>
            <button
              v-if="currentStep > 1"
              @click="previousStep"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Atrás
            </button>
          </div>
          <div class="flex space-x-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {{ currentStep === 3 ? 'Cerrar' : 'Cancelar' }}
            </button>
            <button
              v-if="currentStep === 1 && selectedFile"
              @click="processFile"
              :disabled="isProcessing"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isProcessing ? 'Procesando...' : 'Vista Previa' }}
            </button>
            <button
              v-if="currentStep === 2"
              @click="executeImport"
              :disabled="isImporting || validRecords === 0"
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isImporting ? 'Importando...' : 'Importar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseSelect from '@/components/atoms/BaseSelect.vue'

interface Props {
  type: 'suppliers' | 'supplier-products'
  supplierId?: string
  supplierName?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:3002'
const API_BASE = RAW_API.endsWith('/api') ? RAW_API : `${RAW_API}/api`

// State
const currentStep = ref(1)
const selectedFile = ref<File | null>(null)
const selectedSupplierId = ref<string | null>(props.supplierId || null)
const supplierOptions = ref<Array<{ value: string, label: string }>>([])
const previewData = ref<any[]>([])
const importResults = ref<any>(null)
const isProcessing = ref(false)
const isImporting = ref(false)

// Computed properties based on import type
const modalTitle = computed(() => {
  return props.type === 'suppliers' 
    ? 'Importar Proveedores desde Excel'
    : `Importar Productos de ${props.supplierName || 'Proveedor'}`
})

const formatInstructions = computed(() => {
  return props.type === 'suppliers'
    ? 'El archivo debe contener una hoja con los datos de los proveedores en las columnas especificadas.'
    : 'El archivo debe contener una hoja con los productos del proveedor en las columnas especificadas.'
})

// Cargar proveedores para selección cuando el tipo es "suppliers"
if (props.type === 'suppliers') {
  fetch(`${API_BASE}/suppliers?limit=200`, {
    headers: { 'Authorization': `Bearer ${authStore.token}` }
  }).then(async (r) => {
    if (!r.ok) return
    const data = await r.json()
    const items = data.suppliers || data.items || []
    supplierOptions.value = items.map((s: any) => ({ value: s.id, label: `${s.name} (${s.code})` }))
  }).catch(() => {})
}

const requiredColumns = computed(() => {
  if (props.type === 'suppliers') {
    return [
      { name: 'Código', description: 'Código único del proveedor' },
      { name: 'Nombre', description: 'Nombre o razón social' },
      { name: 'Email', description: 'Correo electrónico' },
      { name: 'Teléfono', description: 'Número de teléfono' },
      { name: 'RUC/DNI', description: 'Número de identificación fiscal' }
    ]
  } else {
    return [
      { name: 'Código Proveedor', description: 'Código del producto en el proveedor' },
      { name: 'Nombre Producto', description: 'Nombre del producto' },
      { name: 'Precio Costo', description: 'Precio de costo' },
      { name: 'Precio Lista', description: 'Precio de lista (opcional)' },
      { name: 'Moneda', description: 'Moneda (opcional, por defecto ARS)' }
    ]
  }
})

const previewColumns = computed(() => {
  if (props.type === 'suppliers') {
    return [
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Nombre' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Teléfono' }
    ]
  } else {
    return [
      { key: 'supplierCode', label: 'Código' },
      { key: 'supplierName', label: 'Nombre' },
      { key: 'costPrice', label: 'Precio Costo' }
    ]
  }
})

const validRecords = computed(() => 
  previewData.value.filter(record => !record.hasErrors).length
)

const errorRecords = computed(() => 
  previewData.value.filter(record => record.hasErrors).length
)

// Methods
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getEndpointUrl = (action: 'preview' | 'execute') => {
  if (props.type === 'suppliers') {
    return `${API_BASE}/suppliers/import/${action}`
  } else {
    return `${API_BASE}/suppliers/${props.supplierId}/products/import/${action}`
  }
}

const processFile = async () => {
  if (!selectedFile.value) return

  isProcessing.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (props.type === 'suppliers' && selectedSupplierId.value) {
      formData.append('supplierId', selectedSupplierId.value)
    }

    const response = await fetch(getEndpointUrl('preview'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error procesando el archivo')
    }

    const data = await response.json()
    previewData.value = data.preview || []
    currentStep.value = 2
  } catch (error) {
    console.error('Error processing file:', error)
    alert(error instanceof Error ? error.message : 'Error procesando el archivo')
  } finally {
    isProcessing.value = false
  }
}

const executeImport = async () => {
  if (!selectedFile.value) return

  isImporting.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (props.type === 'supplier-products') {
      formData.append('updateExisting', 'true')
    }
    if (props.type === 'suppliers') {
      if (!selectedSupplierId.value) {
        alert('Debe seleccionar un proveedor')
        isImporting.value = false
        return
      }
      formData.append('supplierId', selectedSupplierId.value)
    }

    const response = await fetch(getEndpointUrl('execute'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error ejecutando la importación')
    }

    const data = await response.json()
    importResults.value = data.results || data
    currentStep.value = 3
    
    emit('success')
  } catch (error) {
    console.error('Error importing:', error)
    alert(error instanceof Error ? error.message : 'Error ejecutando la importación')
  } finally {
    isImporting.value = false
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}
</script>
