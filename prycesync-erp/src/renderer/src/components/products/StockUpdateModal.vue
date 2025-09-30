<template>
  <BaseModal
    :show="true"
    title="Actualizar Stock"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Current Stock Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-blue-900">{{ product.name }}</h4>
            <p class="text-sm text-blue-700">SKU: {{ product.sku }}</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-900">
              {{ product.stockQuantity }}
            </div>
            <div class="text-sm text-blue-600">{{ product.unit }}</div>
          </div>
        </div>
      </div>

      <!-- Operation Type -->
      <FormField
        label="Tipo de operación"
        :error="errors.type"
        required
      >
        <BaseSelect
          v-model="form.type"
          :options="operationOptions"
          placeholder="Seleccionar operación"
          :error="!!errors.type"
        />
      </FormField>

      <!-- Quantity -->
      <FormField
        label="Cantidad"
        :error="errors.quantity"
        required
      >
        <BaseInput
          v-model="form.quantity"
          type="number"
          min="0"
          step="1"
          placeholder="Ingrese la cantidad"
          :error="!!errors.quantity"
        />
      </FormField>

      <!-- Reason -->
      <FormField
        label="Motivo (opcional)"
        :error="errors.reason"
      >
        <BaseTextarea
          v-model="form.reason"
          placeholder="Motivo del ajuste de stock..."
          rows="3"
          :error="!!errors.reason"
        />
      </FormField>

      <!-- Preview -->
      <div v-if="form.type && form.quantity" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-2">Vista previa</h4>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Stock actual:</span>
          <span class="font-medium">{{ product.stockQuantity }} {{ product.unit }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">{{ getOperationLabel() }}:</span>
          <span class="font-medium">{{ form.quantity }} {{ product.unit }}</span>
        </div>
        <div class="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
          <span class="text-gray-900 font-medium">Stock resultante:</span>
          <span :class="[
            'font-bold text-lg',
            newStock >= 0 ? 'text-green-600' : 'text-red-600'
          ]">
            {{ newStock }} {{ product.unit }}
          </span>
        </div>
        
        <!-- Warning for negative stock -->
        <div v-if="newStock < 0" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ El stock resultante será negativo
        </div>
        
        <!-- Warning for low stock -->
        <div v-else-if="product.minStock && newStock <= product.minStock" class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          ⚠️ El stock resultante estará por debajo del mínimo ({{ product.minStock }})
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t">
        <BaseButton
          type="button"
          variant="ghost"
          @click="$emit('close')"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :loading="loading"
          :disabled="!isFormValid || newStock < 0"
        >
          Actualizar Stock
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useNotifications } from '@/composables/useNotifications'

// Components
import BaseModal from '@/components/atoms/BaseModal.vue'
import FormField from '@/components/atoms/FormField.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseSelect from '@/components/atoms/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

// Props
interface Props {
  product: {
    id: string
    name: string
    sku: string
    stockQuantity: number
    minStock?: number
    maxStock?: number
    unit: string
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  updated: []
}>()

// Composables
const { updateStock } = useProducts()
const { success, error } = useNotifications()

// State
const loading = ref(false)
const form = ref({
  type: '',
  quantity: '',
  reason: ''
})

const errors = ref({
  type: '',
  quantity: '',
  reason: ''
})

// Options
const operationOptions = [
  { value: 'set', label: 'Establecer cantidad exacta' },
  { value: 'add', label: 'Agregar al stock actual' },
  { value: 'subtract', label: 'Restar del stock actual' }
]

// Computed
const newStock = computed(() => {
  if (!form.value.type || !form.value.quantity) return props.product.stockQuantity
  
  const quantity = parseInt(form.value.quantity) || 0
  
  switch (form.value.type) {
    case 'add':
      return props.product.stockQuantity + quantity
    case 'subtract':
      return props.product.stockQuantity - quantity
    case 'set':
      return quantity
    default:
      return props.product.stockQuantity
  }
})

const isFormValid = computed(() => {
  return form.value.type && 
         form.value.quantity && 
         parseInt(form.value.quantity) >= 0 &&
         !errors.value.type && 
         !errors.value.quantity
})

// Methods
const validateForm = () => {
  errors.value = {
    type: '',
    quantity: '',
    reason: ''
  }

  if (!form.value.type) {
    errors.value.type = 'Tipo de operación es requerido'
  }

  if (!form.value.quantity) {
    errors.value.quantity = 'Cantidad es requerida'
  } else {
    const quantity = parseInt(form.value.quantity)
    if (isNaN(quantity) || quantity < 0) {
      errors.value.quantity = 'La cantidad debe ser un número positivo'
    }
  }

  return Object.values(errors.value).every(error => !error)
}

const getOperationLabel = () => {
  switch (form.value.type) {
    case 'add':
      return 'Agregar'
    case 'subtract':
      return 'Restar'
    case 'set':
      return 'Establecer'
    default:
      return ''
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    loading.value = true

    const stockData = {
      quantity: parseInt(form.value.quantity),
      type: form.value.type as 'add' | 'subtract' | 'set',
      reason: form.value.reason || undefined
    }

    await updateStock(props.product.id, stockData)
    
    success('Stock actualizado exitosamente')
    emit('updated')
  } catch (err: any) {
    console.error('Error updating stock:', err)
    error(err.message || 'Error al actualizar el stock')
  } finally {
    loading.value = false
  }
}

// Watch for form changes to clear errors
watch(() => form.value.type, () => {
  if (errors.value.type) errors.value.type = ''
})

watch(() => form.value.quantity, () => {
  if (errors.value.quantity) errors.value.quantity = ''
})
</script>