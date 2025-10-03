<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b">
        <h3 class="text-lg font-medium text-gray-900">
          {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
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

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6 py-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="supplierCode" class="block text-sm font-medium text-gray-700 mb-1">
              Código Proveedor *
            </label>
            <input
              id="supplierCode"
              v-model="formData.supplierCode"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Código único del producto"
            />
          </div>
          <div>
            <label for="supplierName" class="block text-sm font-medium text-gray-700 mb-1">
              Nombre Producto *
            </label>
            <input
              id="supplierName"
              v-model="formData.supplierName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del producto"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descripción detallada del producto"
          ></textarea>
        </div>

        <!-- Pricing -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="costPrice" class="block text-sm font-medium text-gray-700 mb-1">
              Precio Costo *
            </label>
            <input
              id="costPrice"
              v-model.number="formData.costPrice"
              type="number"
              step="0.01"
              min="0"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label for="listPrice" class="block text-sm font-medium text-gray-700 mb-1">
              Precio Lista
            </label>
            <input
              id="listPrice"
              v-model.number="formData.listPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label for="currency" class="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <select
              id="currency"
              v-model="formData.currency"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="USD">USD - Dólar Americano</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        </div>

        <!-- Product Details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="brand" class="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <input
              id="brand"
              v-model="formData.brand"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Marca del producto"
            />
          </div>
          <div>
            <label for="model" class="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              id="model"
              v-model="formData.model"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Modelo del producto"
            />
          </div>
          <div>
            <label for="year" class="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <input
              id="year"
              v-model.number="formData.year"
              type="number"
              min="1900"
              max="2030"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="2024"
            />
          </div>
        </div>

        <!-- Additional Information -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="oem" class="block text-sm font-medium text-gray-700 mb-1">
              Número OEM
            </label>
            <input
              id="oem"
              v-model="formData.oem"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Número OEM"
            />
          </div>
          <div>
            <label for="minQuantity" class="block text-sm font-medium text-gray-700 mb-1">
              Cantidad Mínima
            </label>
            <input
              id="minQuantity"
              v-model.number="formData.minQuantity"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
            />
          </div>
          <div>
            <label for="leadTime" class="block text-sm font-medium text-gray-700 mb-1">
              Tiempo Entrega (días)
            </label>
            <input
              id="leadTime"
              v-model.number="formData.leadTime"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        <!-- Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center">
            <input
              id="isActive"
              v-model="formData.isActive"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="isActive" class="ml-2 block text-sm text-gray-900">
              Producto activo
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="isAvailable"
              v-model="formData.isAvailable"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="isAvailable" class="ml-2 block text-sm text-gray-900">
              Disponible para venta
            </label>
          </div>
        </div>
      </form>

      <!-- Footer -->
      <div class="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from "../../stores/auth";

interface SupplierProduct {
  id?: string
  supplierCode: string
  supplierName: string
  description?: string
  costPrice: number
  listPrice?: number
  currency: string
  brand?: string
  model?: string
  year?: number
  oem?: string
  minQuantity?: number
  leadTime?: number
  isActive: boolean
  isAvailable: boolean
}

interface Props {
  supplierId: string
  product?: SupplierProduct
}

interface Emits {
  (e: 'close'): void
  (e: 'success', product: SupplierProduct): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

// State
const isSubmitting = ref(false)
const formData = ref<SupplierProduct>({
  supplierCode: '',
  supplierName: '',
  description: '',
  costPrice: 0,
  listPrice: 0,
  currency: 'ARS',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  oem: '',
  minQuantity: 1,
  leadTime: 0,
  isActive: true,
  isAvailable: true
})

// Computed
const isEditing = computed(() => !!props.product?.id)

const isFormValid = computed(() => {
  return formData.value.supplierCode.trim() !== '' &&
         formData.value.supplierName.trim() !== '' &&
         formData.value.costPrice > 0
})

// Watch for product changes
watch(() => props.product, (newProduct) => {
  if (newProduct) {
    formData.value = { ...newProduct }
  }
}, { immediate: true })

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const url = isEditing.value 
      ? `${API_BASE}/suppliers/${props.supplierId}/products/${props.product!.id}`
      : `${API_BASE}/suppliers/${props.supplierId}/products`
    
    const method = isEditing.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData.value)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
    }

    const savedProduct = await response.json()
    emit('success', savedProduct)
  } catch (error) {
    console.error('Error saving product:', error)
    alert(error instanceof Error ? error.message : 'Error guardando el producto')
  } finally {
    isSubmitting.value = false
  }
}
</script>