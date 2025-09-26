<template>
  <div class="search-bar">
    <div class="search-input-container">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
        <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="search-input"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.escape="handleEscape"
        ref="searchInput"
      />
      
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="clear-button"
        type="button"
      >
        <svg class="clear-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Resultados de búsqueda -->
    <Transition name="search-results">
      <div v-if="showResults && (searchResults.length > 0 || isSearching)" class="search-results">
        <div v-if="isSearching" class="search-loading">
          <div class="loading-spinner"></div>
          <span>Buscando...</span>
        </div>
        
        <div v-else-if="searchResults.length === 0" class="no-results">
          <svg class="no-results-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>No se encontraron resultados para "{{ searchQuery }}"</p>
        </div>
        
        <div v-else class="results-list">
          <div
            v-for="(result, index) in searchResults"
            :key="result.id"
            class="result-item"
            :class="{ 'result-item--highlighted': index === highlightedIndex }"
            @click="selectResult(result)"
            @mouseenter="highlightedIndex = index"
          >
            <div class="result-icon">
              <component :is="getResultIcon(result.type)" class="result-type-icon" />
            </div>
            <div class="result-content">
              <div class="result-title">{{ result.title }}</div>
              <div class="result-subtitle">{{ result.subtitle }}</div>
            </div>
            <div class="result-badge">
              {{ getResultTypeLabel(result.type) }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

interface SearchResult {
  id: string
  type: 'invoice' | 'customer' | 'product' | 'company'
  title: string
  subtitle: string
  route?: string
  action?: () => void
}

interface Props {
  placeholder?: string
  debounceMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar facturas, clientes, productos...',
  debounceMs: 300
})

const emit = defineEmits<{
  search: [query: string]
  select: [result: SearchResult]
}>()

const router = useRouter()
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const showResults = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(-1)
let searchTimeout: NodeJS.Timeout | null = null

const handleInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchQuery.value.trim()) {
    isSearching.value = true
    searchTimeout = setTimeout(() => {
      performSearch()
    }, props.debounceMs)
  } else {
    searchResults.value = []
    showResults.value = false
    isSearching.value = false
  }
}

const performSearch = async () => {
  try {
    // Simulación de búsqueda - aquí se conectaría con la API real
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'invoice',
        title: `Factura #001-${searchQuery.value}`,
        subtitle: 'Cliente: Juan Pérez - $1,250.00',
        route: '/invoices/1'
      },
      {
        id: '2',
        type: 'customer',
        title: `Cliente ${searchQuery.value}`,
        subtitle: 'juan.perez@email.com - 15 facturas',
        route: '/customers/1'
      },
      {
        id: '3',
        type: 'product',
        title: `Producto ${searchQuery.value}`,
        subtitle: 'Stock: 25 unidades - $45.00',
        route: '/inventory/1'
      }
    ]
    
    searchResults.value = mockResults
    showResults.value = true
    highlightedIndex.value = -1
  } catch (error) {
    console.error('Error en búsqueda:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const handleFocus = () => {
  if (searchQuery.value.trim() && searchResults.value.length > 0) {
    showResults.value = true
  }
}

const handleBlur = () => {
  // Delay para permitir clicks en resultados
  setTimeout(() => {
    showResults.value = false
    highlightedIndex.value = -1
  }, 200)
}

const handleEnter = () => {
  if (highlightedIndex.value >= 0 && searchResults.value[highlightedIndex.value]) {
    selectResult(searchResults.value[highlightedIndex.value])
  } else if (searchQuery.value.trim()) {
    // Búsqueda general
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
    closeSearch()
  }
}

const handleEscape = () => {
  closeSearch()
}

const selectResult = (result: SearchResult) => {
  emit('select', result)
  
  if (result.route) {
    router.push(result.route)
  } else if (result.action) {
    result.action()
  }
  
  closeSearch()
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
  highlightedIndex.value = -1
  searchInput.value?.focus()
}

const closeSearch = () => {
  showResults.value = false
  highlightedIndex.value = -1
  searchInput.value?.blur()
}

const getResultIcon = (type: string) => {
  const icons = {
    invoice: 'InvoiceIcon',
    customer: 'UserIcon', 
    product: 'PackageIcon',
    company: 'BuildingIcon'
  }
  return icons[type as keyof typeof icons] || 'DocumentIcon'
}

const getResultTypeLabel = (type: string) => {
  const labels = {
    invoice: 'Factura',
    customer: 'Cliente',
    product: 'Producto', 
    company: 'Empresa'
  }
  return labels[type as keyof typeof labels] || 'Resultado'
}

// Navegación con teclado
const handleKeyNavigation = (event: KeyboardEvent) => {
  if (!showResults.value || searchResults.value.length === 0) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyNavigation)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyNavigation)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
.search-bar {
  @apply relative w-full max-w-md;
}

.search-input-container {
  @apply relative flex items-center;
}

.search-icon {
  @apply absolute left-3 w-4 h-4 text-gray-400 pointer-events-none;
}

.search-input {
  @apply w-full pl-10 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  @apply placeholder-gray-500 transition-all duration-200;
}

.search-input:focus {
  @apply bg-white shadow-sm;
}

.clear-button {
  @apply absolute right-2 p-1 text-gray-400 hover:text-gray-600 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500;
}

.clear-icon {
  @apply w-4 h-4;
}

.search-results {
  @apply absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50;
  @apply max-h-80 overflow-y-auto;
}

.search-loading {
  @apply flex items-center gap-3 p-4 text-sm text-gray-600;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin;
}

.no-results {
  @apply flex flex-col items-center gap-2 p-6 text-center text-gray-500;
}

.no-results-icon {
  @apply w-8 h-8 text-gray-300;
}

.results-list {
  @apply py-2;
}

.result-item {
  @apply flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors;
}

.result-item--highlighted {
  @apply bg-primary-50 text-primary-900;
}

.result-icon {
  @apply flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center;
}

.result-type-icon {
  @apply w-4 h-4 text-gray-600;
}

.result-content {
  @apply flex-1 min-w-0;
}

.result-title {
  @apply font-medium text-gray-900 truncate;
}

.result-subtitle {
  @apply text-sm text-gray-500 truncate;
}

.result-badge {
  @apply px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full;
}

.result-item--highlighted .result-badge {
  @apply bg-primary-100 text-primary-700;
}

/* Transitions */
.search-results-enter-active,
.search-results-leave-active {
  @apply transition-all duration-200;
}

.search-results-enter-from,
.search-results-leave-to {
  @apply opacity-0 transform scale-95 -translate-y-2;
}

.search-results-enter-to,
.search-results-leave-from {
  @apply opacity-100 transform scale-100 translate-y-0;
}
</style>