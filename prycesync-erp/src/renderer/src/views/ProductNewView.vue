<template>
  <DashboardLayout>
    <div class="product-new-view">
      <!-- Header -->
      <PageHeader
        title="Nuevo Producto"
        subtitle="Crear un nuevo producto en el inventario"
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
            Crear Producto
          </BaseButton>
        </template>
      </PageHeader>

      <!-- Form -->
      <div class="bg-white rounded-lg shadow">
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Basic Information -->
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
                  {{ profitMargin.toFixed(2) }}% ({{ profitAmount.toFixed(2) }})
                </span>
              </div>
            </div>
          </div>

          <!-- Inventory -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Inventario</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Stock Inicial"
                required
                :error="errors.stockQuantity"
              >
                <BaseInput
                  v-model.number="form.stockQuantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  :error="!!errors.stockQuantity"
                  @blur="validateField('stockQuantity')"
                />
              </FormField>

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
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()

// Composables
const { createProduct, isLoading, fetchProducts } = useProducts()
const { fetchCategories, getCategoryOptions } = useCategories()
const { success, error } = useNotifications()

// Form state
const form = ref({
  name: '',
  description: '',
  categoryId: '',
  costPrice: 0,
  salePrice: 0,
  stockQuantity: 0,
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
  { value: 'inactive', label: 'Inactivo' }
]

// Computed
const isFormValid = computed(() => {
  return form.value.name &&
         form.value.costPrice >= 0 &&
         form.value.salePrice >= 0 &&
         form.value.stockQuantity >= 0 &&
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
    
    case 'stockQuantity':
      if (form.value.stockQuantity < 0) {
        newErrors.stockQuantity = 'El stock no puede ser negativo'
      } else {
        delete newErrors.stockQuantity
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
const handleSubmit = async () => {
  if (!validateForm()) {
    error('Por favor, corrija los errores en el formulario')
    return
  }

  try {
    const productData = {
      ...form.value,
      categoryId: form.value.categoryId || undefined
    }
    
    await createProduct(productData)
    
    success('Producto creado exitosamente')
    
    // Actualizar la lista de productos antes de redirigir
    await fetchProducts()
    
    // Usar replace para forzar una navegación completa
    router.replace('/inventory')
  } catch (err: any) {
    console.error('Error creating product:', err)
    error(err.message || 'Error al crear el producto')
  }
}

// Lifecycle
onMounted(async () => {
  // Load categories from API
  try {
    await fetchCategories()
  } catch (error) {
    console.error('Error loading categories:', error)
    error('Error al cargar las categorías')
  }
})
</script>