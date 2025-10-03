<template>
  <DashboardLayout>
    <div class="product-edit-view">
      <!-- Header -->
      <PageHeader
        :title="`Editar Producto: ${currentProduct?.name || 'Cargando...'}`"
        subtitle="Modificar información del producto"
      >
        <template #actions>
          <BaseButton
            variant="ghost"
            @click="$router.push('/inventory')"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="handleSubmit"
            :loading="isLoading"
            :disabled="!isFormValid"
          >
            Guardar Cambios
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Loading State -->
      <div v-if="isLoading && !currentProduct" class="bg-white rounded-lg shadow p-6">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div v-else-if="currentProduct" class="bg-white rounded-lg shadow">
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="SKU"
              :error="errors.sku"
            >
              <BaseInput
                :value="currentProduct.sku"
                disabled
                class="bg-gray-50"
              />
              <p class="text-xs text-gray-500 mt-1">El SKU no se puede modificar</p>
            </FormField>

            <FormField
              label="Estado"
              required
              :error="errors.status"
            >
              <BaseSelect
                v-model="form.status"
                :options="statusOptions"
                :error="!!errors.status"
                @change="validateField('status')"
              />
            </FormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Nombre del Producto"
              required
              :error="errors.name"
            >
              <BaseInput
                v-model="form.name"
                placeholder="Ingrese el nombre del producto"
                :error="!!errors.name"
                @blur="validateField('name')"
              />
            </FormField>

            <FormField
              label="Categoría"
              :error="errors.categoryId"
            >
              <BaseSelect
                v-model="form.categoryId"
                :options="categoryOptions"
                placeholder="Seleccione una categoría"
                :error="!!errors.categoryId"
                @change="validateField('categoryId')"
              />
            </FormField>
          </div>

          <FormField
            label="Descripción"
            :error="errors.description"
          >
            <BaseTextarea
              v-model="form.description"
              placeholder="Descripción del producto (opcional)"
              rows="3"
              :error="!!errors.description"
            />
          </FormField>

          <!-- Pricing -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Precios</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Precio de Costo"
                required
                :error="errors.costPrice"
              >
                <BaseInput
                  v-model.number="form.costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  :error="!!errors.costPrice"
                  @blur="validateField('costPrice')"
                />
              </FormField>

              <FormField
                label="Precio de Venta"
                required
                :error="errors.salePrice"
              >
                <BaseInput
                  v-model.number="form.salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  :error="!!errors.salePrice"
                  @blur="validateField('salePrice')"
                />
              </FormField>
            </div>

            <!-- Margin Calculation -->
            <div v-if="form.costPrice && form.salePrice" class="mt-4 p-4 bg-gray-50 rounded-lg">
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600">Margen de ganancia:</span>
                <span :class="[
                  'font-medium',
                  profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ profitMargin.toFixed(2) }}% (${{ profitAmount.toFixed(2) }})
                </span>
              </div>
            </div>
          </div>

          <!-- Inventory -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Inventario</h3>
            
            <!-- Current Stock (Read-only) -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-blue-900">Stock Actual</h4>
                  <p class="text-sm text-blue-700">
                    {{ currentProduct.stockQuantity }} {{ currentProduct.unit }}
                  </p>
                </div>
                <BaseButton
                  variant="outline"
                  size="sm"
                  @click="showStockModal = true"
                >
                  Actualizar Stock
                </BaseButton>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Stock Mínimo"
                :error="errors.minStock"
              >
                <BaseInput
                  v-model.number="form.minStock"
                  type="number"
                  min="0"
                  placeholder="0"
                  :error="!!errors.minStock"
                />
              </FormField>

              <FormField
                label="Stock Máximo"
                :error="errors.maxStock"
              >
                <BaseInput
                  v-model.number="form.maxStock"
                  type="number"
                  min="0"
                  placeholder="0"
                  :error="!!errors.maxStock"
                />
              </FormField>

              <FormField
                label="Unidad de Medida"
                required
                :error="errors.unit"
              >
                <BaseSelect
                  v-model="form.unit"
                  :options="unitOptions"
                  placeholder="Seleccione una unidad"
                  :error="!!errors.unit"
                  @change="validateField('unit')"
                />
              </FormField>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="border-t pt-6">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 class="text-lg font-medium text-red-900 mb-2">Zona de Peligro</h3>
              <p class="text-sm text-red-700 mb-4">
                Eliminar este producto lo marcará como inactivo. Esta acción no se puede deshacer.
              </p>
              <BaseButton
                variant="danger"
                @click="showDeleteModal = true"
                :disabled="isLoading"
              >
                Eliminar Producto
              </BaseButton>
            </div>
          </div>
        </form>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="bg-white rounded-lg shadow p-6">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Error al cargar el producto</h3>
          <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
          <div class="mt-6">
            <BaseButton
              variant="primary"
              @click="loadProduct"
            >
              Reintentar
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Stock Update Modal -->
      <StockUpdateModal
        v-if="showStockModal"
        :product="currentProduct"
        @close="showStockModal = false"
        @updated="handleStockUpdated"
      />

      <!-- Delete Confirmation Modal -->
      <ConfirmModal
        v-if="showDeleteModal"
        title="Eliminar Producto"
        :message="`¿Está seguro que desea eliminar el producto '${currentProduct?.name}'?`"
        confirm-text="Eliminar"
        confirm-variant="danger"
        @confirm="handleDelete"
        @cancel="showDeleteModal = false"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProducts } from '@/composables/useProducts'
import { useCategories } from '@/composables/useCategories'
import { useNotifications } from '@/composables/useNotifications'

// Components
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import StockUpdateModal from '@/components/products/StockUpdateModal.vue'
import ConfirmModal from '@/components/atoms/ConfirmModal.vue'

const router = useRouter()
const route = useRoute()

// Composables
const {
  currentProduct,
  isLoading,
  hasError,
  error,
  fetchProduct,
  updateProduct,
  deleteProduct
} = useProducts()

const { fetchCategories, getCategoryOptions } = useCategories()
const { success, error: notificationError } = useNotifications()

// State
const showStockModal = ref(false)
const showDeleteModal = ref(false)

// Form state
const form = ref({
  name: '',
  description: '',
  categoryId: '',
  costPrice: 0,
  salePrice: 0,
  minStock: 0,
  maxStock: 0,
  unit: '',
  status: 'active'
})

const errors = ref({})

// Options
const categoryOptions = computed(() => getCategoryOptions(true))

const unitOptions = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'l', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'm', label: 'Metro' },
  { value: 'cm', label: 'Centímetro' },
  { value: 'm2', label: 'Metro cuadrado' },
  { value: 'm3', label: 'Metro cúbico' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'docena', label: 'Docena' }
]

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'discontinued', label: 'Descontinuado' }
]

// Computed
const isFormValid = computed(() => {
  return form.value.name &&
         form.value.costPrice >= 0 &&
         form.value.salePrice >= 0 &&
         form.value.unit &&
         form.value.status &&
         Object.keys(errors.value).length === 0
})

const profitMargin = computed(() => {
  if (!form.value.costPrice || !form.value.salePrice) return 0
  return ((form.value.salePrice - form.value.costPrice) / form.value.costPrice) * 100
})

const profitAmount = computed(() => {
  return form.value.salePrice - form.value.costPrice
})

// Validation
const validateField = (field: string) => {
  const newErrors = { ...errors.value }
  
  switch (field) {
    case 'name':
      if (!form.value.name.trim()) {
        newErrors.name = 'El nombre es requerido'
      } else {
        delete newErrors.name
      }
      break
    
    case 'costPrice':
      if (form.value.costPrice < 0) {
        newErrors.costPrice = 'El precio de costo no puede ser negativo'
      } else {
        delete newErrors.costPrice
      }
      break
    
    case 'salePrice':
      if (form.value.salePrice < 0) {
        newErrors.salePrice = 'El precio de venta no puede ser negativo'
      } else {
        delete newErrors.salePrice
      }
      break
    
    case 'unit':
      if (!form.value.unit) {
        newErrors.unit = 'La unidad de medida es requerida'
      } else {
        delete newErrors.unit
      }
      break
    
    case 'status':
      if (!form.value.status) {
        newErrors.status = 'El estado es requerido'
      } else {
        delete newErrors.status
      }
      break
  }
  
  errors.value = newErrors
}

const validateForm = () => {
  Object.keys(form.value).forEach(field => {
    validateField(field)
  })
  
  // Additional validations
  if (form.value.maxStock && form.value.minStock && form.value.maxStock < form.value.minStock) {
    errors.value.maxStock = 'El stock máximo debe ser mayor al mínimo'
  }
  
  return Object.keys(errors.value).length === 0
}

// Methods
const loadProduct = async () => {
  const productId = route.params.id as string
  if (productId) {
    try {
      await fetchProduct(productId)
      populateForm()
    } catch (error) {
      console.error('Error loading product:', error)
    }
  }
}

const populateForm = () => {
  if (currentProduct.value) {
    form.value = {
      name: currentProduct.value.name,
      description: currentProduct.value.description || '',
      categoryId: currentProduct.value.categoryId || '',
      costPrice: currentProduct.value.costPrice,
      salePrice: currentProduct.value.salePrice,
      minStock: currentProduct.value.minStock || 0,
      maxStock: currentProduct.value.maxStock || 0,
      unit: currentProduct.value.unit,
      status: currentProduct.value.status
    }
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    notificationError('Por favor, corrija los errores en el formulario')
    return
  }

  try {
    const productId = route.params.id as string
    const updateData = {
      ...form.value,
      categoryId: form.value.categoryId || undefined
    }
    
    await updateProduct(productId, updateData)
    
    success('Producto actualizado exitosamente')
    router.push('/inventory')
  } catch (err: any) {
    console.error('Error updating product:', err)
    notificationError(err.message || 'Error al actualizar el producto')
  }
}

const handleDelete = async () => {
  try {
    const productId = route.params.id as string
    await deleteProduct(productId)
    
    success('Producto eliminado exitosamente')
    router.push('/inventory')
  } catch (err: any) {
    console.error('Error deleting product:', err)
    notificationError(err.message || 'Error al eliminar el producto')
  } finally {
    showDeleteModal.value = false
  }
}

const handleStockUpdated = () => {
  showStockModal.value = false
  loadProduct() // Reload to get updated stock
}

// Lifecycle
onMounted(async () => {
  // Load categories from API
  try {
    await fetchCategories()
  } catch (err) {
    console.error('Error loading categories:', err)
    notificationError('Error al cargar las categorías')
  }
  
  loadProduct()
})

// Watch for product changes
watch(currentProduct, () => {
  if (currentProduct.value) {
    populateForm()
  }
}, { immediate: true })
</script>