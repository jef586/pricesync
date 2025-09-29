<template>
  <div class="editable-item-list">
    <!-- Header con título y botón agregar -->
    <div class="flex items-center justify-between mb-4">
      <h3 v-if="title" class="text-lg font-medium text-gray-900">{{ title }}</h3>
      
      <BaseButton
        @click="addItem"
        variant="outline"
        size="sm"
        :disabled="disabled || (maxItems && items.length >= maxItems)"
      >
        <PlusIcon class="w-4 h-4 mr-1" />
        {{ addButtonText }}
      </BaseButton>
    </div>

    <!-- Lista de items -->
    <div v-if="items.length > 0" class="space-y-3">
      <div
        v-for="(item, index) in items"
        :key="getItemKey(item, index)"
        class="item-row"
        :class="itemRowClasses"
      >
        <!-- Contenido del item usando slot -->
        <div class="flex-1">
          <slot 
            name="item" 
            :item="item" 
            :index="index" 
            :update-item="(field, value) => updateItem(index, field, value)"
            :errors="getItemErrors(index)"
          >
            <!-- Fallback por defecto si no se proporciona slot -->
            <div class="grid grid-cols-12 gap-3 items-center">
              <div v-for="field in fields" :key="field.key" :class="field.colSpan || 'col-span-2'">
                <BaseInput
                  :model-value="item[field.key]"
                  @update:model-value="(value) => updateItem(index, field.key, value)"
                  :placeholder="field.placeholder"
                  :type="field.type || 'text'"
                  :disabled="disabled"
                  :error="getFieldError(index, field.key)"
                  size="sm"
                />
              </div>
            </div>
          </slot>
        </div>

        <!-- Botón eliminar -->
        <div class="flex-shrink-0 ml-3">
          <BaseButton
            @click="removeItem(index)"
            variant="ghost"
            size="sm"
            :disabled="disabled || (minItems && items.length <= minItems)"
            class="text-red-600 hover:text-red-800"
          >
            <TrashIcon class="w-4 h-4" />
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="empty-state" :class="emptyStateClasses">
      <slot name="empty">
        <div class="text-center py-8">
          <div class="mx-auto h-12 w-12 text-gray-400">
            <component :is="emptyIcon" class="h-full w-full" />
          </div>
          <h3 class="mt-2 text-sm font-medium text-gray-900">{{ emptyTitle }}</h3>
          <p class="mt-1 text-sm text-gray-500">{{ emptyDescription }}</p>
          <div class="mt-6">
            <BaseButton
              @click="addItem"
              variant="primary"
              size="sm"
              :disabled="disabled"
            >
              <PlusIcon class="w-4 h-4 mr-1" />
              {{ addButtonText }}
            </BaseButton>
          </div>
        </div>
      </slot>
    </div>

    <!-- Errores generales -->
    <div v-if="generalError" class="mt-3">
      <div class="bg-red-50 border border-red-200 rounded-md p-3">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <p class="text-sm text-red-800">{{ generalError }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Información adicional -->
    <div v-if="showSummary && items.length > 0" class="mt-4 text-sm text-gray-500">
      <slot name="summary" :items="items" :count="items.length">
        Total de items: {{ items.length }}
        <span v-if="maxItems"> / {{ maxItems }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import BaseInput from '../atoms/BaseInput.vue'
import BaseButton from '../atoms/BaseButton.vue'
import { 
  PlusIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  DocumentIcon 
} from '@heroicons/vue/24/outline'

const props = defineProps({
  // Datos
  modelValue: {
    type: Array,
    default: () => []
  },
  
  // Configuración básica
  title: {
    type: String,
    default: ''
  },
  
  // Configuración de campos (para el fallback)
  fields: {
    type: Array,
    default: () => []
  },
  
  // Configuración de items
  itemTemplate: {
    type: Object,
    default: () => ({})
  },
  keyField: {
    type: String,
    default: 'id'
  },
  
  // Límites
  minItems: {
    type: Number,
    default: 0
  },
  maxItems: {
    type: Number,
    default: null
  },
  
  // Textos personalizables
  addButtonText: {
    type: String,
    default: 'Agregar Item'
  },
  emptyTitle: {
    type: String,
    default: 'No hay items'
  },
  emptyDescription: {
    type: String,
    default: 'Comienza agregando un nuevo item'
  },
  
  // Estados
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  
  // Errores
  errors: {
    type: [Object, Array],
    default: () => ({})
  },
  generalError: {
    type: String,
    default: ''
  },
  
  // Configuración visual
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact', 'card'].includes(value)
  },
  
  // Configuración adicional
  showSummary: {
    type: Boolean,
    default: false
  },
  emptyIcon: {
    type: Object,
    default: () => DocumentIcon
  },
  
  // Validación personalizada
  validateItem: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'add-item', 'remove-item', 'update-item'])

// Computed
const items = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})

const itemRowClasses = computed(() => {
  const classes = ['flex items-start']
  
  switch (props.variant) {
    case 'compact':
      classes.push('py-2')
      break
    case 'card':
      classes.push('bg-white border border-gray-200 rounded-lg p-4')
      break
    default:
      classes.push('bg-gray-50 border border-gray-200 rounded-md p-3')
  }
  
  return classes
})

const emptyStateClasses = computed(() => {
  const classes = []
  
  if (props.variant === 'card') {
    classes.push('bg-white border-2 border-dashed border-gray-300 rounded-lg')
  } else {
    classes.push('border-2 border-dashed border-gray-300 rounded-md')
  }
  
  return classes
})

// Métodos
const getItemKey = (item, index) => {
  return item[props.keyField] || `item-${index}`
}

const addItem = () => {
  if (props.maxItems && items.value.length >= props.maxItems) {
    return
  }
  
  const newItem = { ...props.itemTemplate }
  
  // Generar ID único si no existe
  if (props.keyField === 'id' && !newItem.id) {
    newItem.id = Date.now() + Math.random()
  }
  
  const newItems = [...items.value, newItem]
  items.value = newItems
  
  emit('add-item', { item: newItem, index: newItems.length - 1 })
}

const removeItem = (index) => {
  if (props.minItems && items.value.length <= props.minItems) {
    return
  }
  
  const itemToRemove = items.value[index]
  const newItems = items.value.filter((_, i) => i !== index)
  items.value = newItems
  
  emit('remove-item', { item: itemToRemove, index })
}

const updateItem = (index, field, value) => {
  const newItems = [...items.value]
  newItems[index] = { ...newItems[index], [field]: value }
  
  // Validación personalizada si está definida
  if (props.validateItem) {
    const validation = props.validateItem(newItems[index], index)
    if (validation && !validation.valid) {
      // Manejar errores de validación
      console.warn('Validation failed:', validation.errors)
    }
  }
  
  items.value = newItems
  
  emit('update-item', { 
    item: newItems[index], 
    index, 
    field, 
    value 
  })
}

const getItemErrors = (index) => {
  if (Array.isArray(props.errors)) {
    return props.errors[index] || {}
  }
  return props.errors[index] || {}
}

const getFieldError = (index, field) => {
  const itemErrors = getItemErrors(index)
  return itemErrors[field] || ''
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (!newValue || newValue.length === 0) {
    // Asegurar mínimo de items si está configurado
    if (props.minItems > 0) {
      const itemsToAdd = []
      for (let i = 0; i < props.minItems; i++) {
        itemsToAdd.push({ ...props.itemTemplate })
      }
      items.value = itemsToAdd
    }
  }
}, { immediate: true })
</script>

<style scoped>
.editable-item-list {
  @apply w-full;
}

.item-row {
  @apply transition-all duration-200 ease-in-out;
}

.item-row:hover {
  @apply shadow-sm;
}

.empty-state {
  @apply transition-all duration-200 ease-in-out;
}
</style>