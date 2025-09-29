<template>
  <div class="entity-search">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ label }}
      </label>
      
      <div class="flex gap-2">
        <BaseInput
          :model-value="searchQuery"
          @update:model-value="handleSearch"
          :placeholder="placeholder"
          :disabled="disabled"
          class="flex-1"
        />
        
        <BaseButton
          v-if="showCreateButton"
          @click="$emit('create')"
          variant="outline"
          size="sm"
          :disabled="disabled"
        >
          <PlusIcon class="w-4 h-4 mr-1" />
          {{ createButtonText }}
        </BaseButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-sm text-gray-500 mt-2">Buscando...</p>
    </div>

    <!-- Search Results -->
    <div v-else-if="searchResults.length > 0 && searchQuery" class="mb-4">
      <div class="border rounded-lg max-h-48 overflow-y-auto">
        <div
          v-for="item in searchResults"
          :key="getItemId(item)"
          @click="selectItem(item)"
          class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
        >
          <slot name="result-item" :item="item">
            <div class="font-medium">{{ getItemDisplay(item) }}</div>
            <div v-if="getItemSecondary(item)" class="text-sm text-gray-500">
              {{ getItemSecondary(item) }}
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="searchQuery && !loading && searchResults.length === 0" class="text-center py-4">
      <p class="text-sm text-gray-500">No se encontraron resultados</p>
    </div>

    <!-- Selected Item Display -->
    <div v-if="selectedItem" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <slot name="selected-item" :item="selectedItem">
            <h4 class="font-medium text-blue-900">{{ getItemDisplay(selectedItem) }}</h4>
            <p v-if="getItemSecondary(selectedItem)" class="text-sm text-blue-700 mt-1">
              {{ getItemSecondary(selectedItem) }}
            </p>
          </slot>
        </div>
        
        <BaseButton
          @click="clearSelection"
          variant="ghost"
          size="sm"
          class="text-blue-600 hover:text-blue-800"
        >
          <XMarkIcon class="w-4 h-4" />
        </BaseButton>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { debounce } from 'lodash-es'
import BaseInput from '../atoms/BaseInput.vue'
import BaseButton from '../atoms/BaseButton.vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  // Configuración básica
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Buscar...'
  },
  
  // Función de búsqueda
  searchFunction: {
    type: Function,
    required: true
  },
  
  // Configuración de visualización
  displayField: {
    type: [String, Function],
    default: 'name'
  },
  secondaryField: {
    type: [String, Function],
    default: null
  },
  idField: {
    type: String,
    default: 'id'
  },
  
  // Item seleccionado
  modelValue: {
    type: Object,
    default: null
  },
  
  // Configuración del botón crear
  showCreateButton: {
    type: Boolean,
    default: true
  },
  createButtonText: {
    type: String,
    default: 'Crear Nuevo'
  },
  
  // Estados
  disabled: {
    type: Boolean,
    default: false
  },
  
  // Configuración de búsqueda
  minSearchLength: {
    type: Number,
    default: 2
  },
  debounceMs: {
    type: Number,
    default: 300
  }
})

const emit = defineEmits(['update:modelValue', 'create', 'select', 'search'])

// Estado interno
const searchQuery = ref('')
const searchResults = ref([])
const loading = ref(false)
const error = ref('')

// Computed
const selectedItem = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Métodos para obtener valores de los items
const getItemId = (item) => {
  return typeof props.idField === 'function' 
    ? props.idField(item) 
    : item[props.idField]
}

const getItemDisplay = (item) => {
  return typeof props.displayField === 'function' 
    ? props.displayField(item) 
    : item[props.displayField]
}

const getItemSecondary = (item) => {
  if (!props.secondaryField) return null
  return typeof props.secondaryField === 'function' 
    ? props.secondaryField(item) 
    : item[props.secondaryField]
}

// Búsqueda con debounce
const debouncedSearch = debounce(async (query) => {
  if (!query || query.length < props.minSearchLength) {
    searchResults.value = []
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    const results = await props.searchFunction(query)
    searchResults.value = Array.isArray(results) ? results : []
    
    emit('search', { query, results: searchResults.value })
  } catch (err) {
    console.error('Error en búsqueda:', err)
    error.value = 'Error al realizar la búsqueda'
    searchResults.value = []
  } finally {
    loading.value = false
  }
}, props.debounceMs)

// Handlers
const handleSearch = (value) => {
  searchQuery.value = value
  debouncedSearch(value)
}

const selectItem = (item) => {
  selectedItem.value = item
  searchQuery.value = ''
  searchResults.value = []
  emit('select', item)
}

const clearSelection = () => {
  selectedItem.value = null
  searchQuery.value = ''
  searchResults.value = []
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    searchQuery.value = ''
    searchResults.value = []
  }
})
</script>

<style scoped>
.entity-search {
  @apply w-full;
}
</style>