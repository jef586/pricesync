<template>
  <div class="entity-selector" :class="containerClasses">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div class="relative">
      <!-- Selector principal -->
      <BaseSelect
        :model-value="selectedValue"
        @update:model-value="handleSelection"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        :error="error"
        :options="processedOptions"
        :clearable="clearable"
        :searchable="searchable"
        class="w-full"
      />

      <!-- Botones de acción -->
      <div v-if="showActions" class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
        <!-- Botón refrescar -->
        <BaseButton
          v-if="showRefreshButton"
          @click="refreshOptions"
          variant="ghost"
          size="xs"
          :disabled="disabled || loading"
          class="p-1"
        >
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </BaseButton>

        <!-- Botón crear nuevo -->
        <BaseButton
          v-if="showCreateButton"
          @click="$emit('create')"
          variant="ghost"
          size="xs"
          :disabled="disabled"
          class="p-1 text-blue-600 hover:text-blue-800"
        >
          <PlusIcon class="w-4 h-4" />
        </BaseButton>
      </div>
    </div>

    <!-- Información del item seleccionado -->
    <div v-if="selectedItem && showSelectedInfo" class="mt-3">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <slot name="selected-info" :item="selectedItem">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-medium text-blue-900">{{ getItemDisplay(selectedItem) }}</h4>
              <p v-if="getItemSecondary(selectedItem)" class="text-sm text-blue-700 mt-1">
                {{ getItemSecondary(selectedItem) }}
              </p>
            </div>
            
            <BaseButton
              v-if="allowEdit"
              @click="$emit('edit', selectedItem)"
              variant="ghost"
              size="sm"
              class="text-blue-600 hover:text-blue-800"
            >
              <PencilIcon class="w-4 h-4" />
            </BaseButton>
          </div>
        </slot>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading && !options.length" class="mt-2 text-center">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-xs text-gray-500 mt-1">Cargando opciones...</p>
    </div>

    <!-- Error de carga -->
    <div v-if="loadError" class="mt-2">
      <div class="bg-red-50 border border-red-200 rounded-md p-2">
        <div class="flex items-center">
          <ExclamationTriangleIcon class="h-4 w-4 text-red-400 mr-2" />
          <p class="text-sm text-red-800">{{ loadError }}</p>
          <BaseButton
            @click="refreshOptions"
            variant="ghost"
            size="xs"
            class="ml-auto text-red-600 hover:text-red-800"
          >
            Reintentar
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Información adicional -->
    <div v-if="helpText" class="mt-2">
      <p class="text-sm text-gray-500">{{ helpText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseSelect from '../atoms/BaseSelect.vue'
import BaseButton from '../atoms/BaseButton.vue'
import { 
  ArrowPathIcon, 
  PlusIcon, 
  PencilIcon,
  ExclamationTriangleIcon 
} from '@heroicons/vue/24/outline'

const props = defineProps({
  // Configuración básica
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Seleccionar...'
  },
  helpText: {
    type: String,
    default: ''
  },
  
  // Valor seleccionado
  modelValue: {
    type: [String, Number, Object],
    default: null
  },
  
  // Opciones
  options: {
    type: Array,
    default: () => []
  },
  
  // Función para cargar opciones dinámicamente
  loadOptions: {
    type: Function,
    default: null
  },
  
  // Configuración de campos
  valueField: {
    type: String,
    default: 'id'
  },
  labelField: {
    type: [String, Function],
    default: 'name'
  },
  secondaryField: {
    type: [String, Function],
    default: null
  },
  
  // Configuración de comportamiento
  clearable: {
    type: Boolean,
    default: true
  },
  searchable: {
    type: Boolean,
    default: true
  },
  required: {
    type: Boolean,
    default: false
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
  error: {
    type: String,
    default: ''
  },
  
  // Configuración visual
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact', 'minimal'].includes(value)
  },
  
  // Configuración de acciones
  showActions: {
    type: Boolean,
    default: true
  },
  showRefreshButton: {
    type: Boolean,
    default: true
  },
  showCreateButton: {
    type: Boolean,
    default: true
  },
  showSelectedInfo: {
    type: Boolean,
    default: false
  },
  allowEdit: {
    type: Boolean,
    default: false
  },
  
  // Configuración de carga automática
  autoLoad: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:modelValue', 
  'select', 
  'create', 
  'edit', 
  'refresh',
  'load-error'
])

// Estado interno
const loadError = ref('')
const internalLoading = ref(false)

// Computed
const containerClasses = computed(() => {
  const classes = ['entity-selector']
  
  switch (props.variant) {
    case 'compact':
      classes.push('space-y-1')
      break
    case 'minimal':
      classes.push('space-y-0')
      break
    default:
      classes.push('space-y-2')
  }
  
  return classes
})

const processedOptions = computed(() => {
  return props.options.map(option => ({
    value: getOptionValue(option),
    label: getOptionLabel(option),
    secondary: getOptionSecondary(option),
    original: option
  }))
})

const selectedValue = computed({
  get: () => {
    if (!props.modelValue) return null
    
    // Si el modelValue es un objeto, extraer el valor
    if (typeof props.modelValue === 'object') {
      return getOptionValue(props.modelValue)
    }
    
    return props.modelValue
  },
  set: (value) => {
    const selectedOption = props.options.find(option => 
      getOptionValue(option) === value
    )
    
    emit('update:modelValue', selectedOption || value)
    
    if (selectedOption) {
      emit('select', selectedOption)
    }
  }
})

const selectedItem = computed(() => {
  if (!props.modelValue) return null
  
  if (typeof props.modelValue === 'object') {
    return props.modelValue
  }
  
  return props.options.find(option => 
    getOptionValue(option) === props.modelValue
  )
})

// Métodos
const getOptionValue = (option) => {
  return typeof props.valueField === 'function' 
    ? props.valueField(option) 
    : option[props.valueField]
}

const getOptionLabel = (option) => {
  return typeof props.labelField === 'function' 
    ? props.labelField(option) 
    : option[props.labelField]
}

const getOptionSecondary = (option) => {
  if (!props.secondaryField) return null
  return typeof props.secondaryField === 'function' 
    ? props.secondaryField(option) 
    : option[props.secondaryField]
}

const getItemDisplay = (item) => {
  return getOptionLabel(item)
}

const getItemSecondary = (item) => {
  return getOptionSecondary(item)
}

const handleSelection = (value) => {
  selectedValue.value = value
}

const refreshOptions = async () => {
  if (!props.loadOptions) {
    emit('refresh')
    return
  }
  
  try {
    internalLoading.value = true
    loadError.value = ''
    
    await props.loadOptions()
    emit('refresh')
  } catch (error) {
    console.error('Error loading options:', error)
    loadError.value = 'Error al cargar las opciones'
    emit('load-error', error)
  } finally {
    internalLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (props.autoLoad && props.loadOptions && props.options.length === 0) {
    refreshOptions()
  }
})

// Watchers
watch(() => props.options, (newOptions) => {
  // Validar que el valor seleccionado aún existe en las opciones
  if (props.modelValue && newOptions.length > 0) {
    const exists = newOptions.some(option => 
      getOptionValue(option) === selectedValue.value
    )
    
    if (!exists) {
      emit('update:modelValue', null)
    }
  }
})
</script>

<style scoped>
.entity-selector {
  @apply relative;
}
</style>