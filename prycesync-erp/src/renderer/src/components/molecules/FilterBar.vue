<template>
  <BaseCard :class="['filter-bar', compact ? 'filter-bar--compact' : '']">
    <div
      :class="['filter-toolbar', sticky ? 'filter-toolbar--sticky' : '']"
      role="toolbar"
      aria-label="Barra de filtros"
    >
      <slot name="toolbar" :update-filter="updateFilter" :apply="emitApply" :reset="emitReset">
        <div class="toolbar-default">
          <div v-if="showSearch" class="toolbar-search">
            <BaseInput
              :model-value="modelValue.search || ''"
              :placeholder="searchPlaceholder"
              @update:model-value="updateFilter('search', $event)"
              @input="handleSearchInput"
              @keydown.enter="emitSearchInstant"
              ref="searchInput"
            >
              <template #prefix>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </template>
            </BaseInput>
          </div>
          <div v-if="statusOptions.length > 0" class="toolbar-select">
            <select
              :value="modelValue.status || ''"
              @change="updateFilter('status', ($event.target as HTMLSelectElement).value)"
              class="filter-select"
              aria-label="Estado"
            >
              <option value="">Todos</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
          <div v-if="stockOptions.length > 0" class="toolbar-select">
            <select
              :value="modelValue.stockState || 'all'"
              @change="updateFilter('stockState', ($event.target as HTMLSelectElement).value)"
              class="filter-select"
              aria-label="Stock"
            >
              <option value="all">Todos</option>
              <option v-for="option in stockOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
          <div class="toolbar-actions">
            <BaseButton variant="primary" size="sm" @click="emitApply">Buscar</BaseButton>
            <BaseButton variant="ghost" size="sm" @click="clearAllFilters">Limpiar</BaseButton>
            <BaseButton variant="secondary" size="sm" @click="toggleAdvanced">Avanzados</BaseButton>
          </div>
        </div>
      </slot>
    </div>

    <div v-show="advancedOpen" class="advanced-panel" aria-expanded="advancedOpen">
      <slot name="advanced" :update-filter="updateFilter">
        <div class="filter-item col-span-full">
          <slot name="custom-filters" :update-filter="updateFilter" />
        </div>
        <div class="advanced-actions">
          <BaseButton variant="primary" size="sm" @click="emitApply">Aplicar</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="resetAdvanced">Restablecer</BaseButton>
        </div>
      </slot>
    </div>

    <div class="chips-row" v-if="hasActiveFilters">
      <slot name="activeChips" :filters="activeFiltersList" :clear="clearFilter" :clearAll="clearAllFilters">
        <span class="active-filters-label">Filtros activos:</span>
        <div class="filter-tags">
          <span v-for="filter in activeFiltersList" :key="filter.key" class="filter-tag">
            {{ filter.label }}: {{ filter.value }}
            <button @click="clearFilter(filter.key)" class="filter-tag-remove" aria-label="Quitar filtro">✕</button>
          </span>
        </div>
        <BaseButton v-if="hasActiveFilters" variant="ghost" size="sm" class="ml-2" @click="clearAllFilters">Limpiar todos</BaseButton>
      </slot>
      <div class="chips-presets">
        <slot name="presets" :apply-preset="applyPreset" />
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import BaseCard from '../atoms/BaseCard.vue'
import BaseInput from '../atoms/BaseInput.vue'
import BaseButton from '../atoms/BaseButton.vue'

interface FilterOption {
  value: string
  label: string
}

interface FilterValues {
  search?: string
  status?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: any
}

interface Props {
  modelValue: FilterValues
  statusOptions?: FilterOption[]
  typeOptions?: FilterOption[]
  stockOptions?: FilterOption[]
  showSearch?: boolean
  showDateRange?: boolean
  searchPlaceholder?: string
  debounceMs?: number
  compact?: boolean
  sticky?: boolean
  persistKey?: string
}

interface Emits {
  (e: 'update:modelValue', value: FilterValues): void
  (e: 'filter-change', filters: FilterValues): void
  (e: 'search', query: string): void
}

const props = withDefaults(defineProps<Props>(), {
  statusOptions: () => [],
  typeOptions: () => [],
  stockOptions: () => [],
  showSearch: true,
  showDateRange: true,
  searchPlaceholder: 'Buscar...',
  debounceMs: 300,
  compact: false,
  sticky: false,
  persistKey: undefined
})

const emit = defineEmits<Emits & { (e: 'apply', value: FilterValues): void; (e: 'reset'): void }>()

let searchTimeout: NodeJS.Timeout | null = null
const advancedOpen = ref(false)
const searchInput = ref<any>(null)

const updateFilter = (key: string, value: any) => {
  const newFilters = { ...props.modelValue, [key]: value }
  emit('update:modelValue', newFilters)
  emit('filter-change', newFilters)
}

const handleSearchInput = (value: string) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    emit('search', value)
  }, props.debounceMs)
}

const emitSearchInstant = () => {
  const q = (props.modelValue.search ?? '').toString()
  emit('search', q)
}

const emitApply = () => {
  emit('apply', props.modelValue)
}

const emitReset = () => {
  emit('reset')
}

const clearFilter = (key: string) => {
  const newFilters = { ...props.modelValue }
  delete newFilters[key]
  emit('update:modelValue', newFilters)
  emit('filter-change', newFilters)
}

const clearAllFilters = () => {
  emit('update:modelValue', {})
  emit('filter-change', {})
  emitReset()
}

const onSearchClick = () => {
  const q = (props.modelValue.search ?? '').toString()
  emit('search', q)
}

const hasActiveFilters = computed(() => {
  return Object.values(props.modelValue).some(value => 
    value !== null && value !== undefined && value !== ''
  )
})

const activeFiltersList = computed(() => {
  const filters = []
  
  if (props.modelValue.search) {
    filters.push({
      key: 'search',
      label: 'Búsqueda',
      value: props.modelValue.search
    })
  }
  
  if (props.modelValue.status) {
    const statusOption = props.statusOptions.find(opt => opt.value === props.modelValue.status)
    filters.push({
      key: 'status',
      label: 'Estado',
      value: statusOption?.label || props.modelValue.status
    })
  }
  
  if (props.modelValue.type) {
    const typeOption = props.typeOptions.find(opt => opt.value === props.modelValue.type)
    filters.push({
      key: 'type',
      label: 'Tipo',
      value: typeOption?.label || props.modelValue.type
    })
  }
  
  if (props.modelValue.dateFrom) {
    filters.push({
      key: 'dateFrom',
      label: 'Desde',
      value: new Date(props.modelValue.dateFrom).toLocaleDateString()
    })
  }
  
  if (props.modelValue.dateTo) {
    filters.push({
      key: 'dateTo',
      label: 'Hasta',
      value: new Date(props.modelValue.dateTo).toLocaleDateString()
    })
  }
  
  return filters
})

const toggleAdvanced = () => {
  advancedOpen.value = !advancedOpen.value
  persistState()
}

const resetAdvanced = () => {
  const baseKeys = new Set(['search', 'status', 'stockState'])
  const newFilters: FilterValues = {}
  Object.entries(props.modelValue).forEach(([k, v]) => {
    if (baseKeys.has(k)) (newFilters as any)[k] = v
  })
  emit('update:modelValue', newFilters)
  emit('filter-change', newFilters)
}

const applyPreset = (preset: string) => {
  if (preset === 'solo-activos') updateFilter('status', 'active')
  else if (preset === 'bajo-stock') updateFilter('stockState', 'low')
  else if (preset === 'sin-precios') updateFilter('vatRate', '')
  emitApply()
}

const persistState = () => {
  if (!props.persistKey) return
  const payload = { filters: props.modelValue, advancedOpen: advancedOpen.value }
  try { localStorage.setItem(props.persistKey, JSON.stringify(payload)) } catch {}
}

const loadPersisted = () => {
  if (!props.persistKey) return
  try {
    const raw = localStorage.getItem(props.persistKey)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') {
      if (data.filters) emit('update:modelValue', data.filters)
      advancedOpen.value = !!data.advancedOpen
    }
  } catch {}
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === '/') { e.preventDefault(); (searchInput.value as any)?.focus?.() }
  else if (e.key === 'Escape') { updateFilter('search', ''); emitReset() }
}

onMounted(() => {
  loadPersisted()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

watch(() => props.modelValue, persistState, { deep: true })
</script>

<style scoped>
.filter-bar {
  @apply bg-white border border-gray-200 rounded-md shadow-sm;
}

.filter-label {
  @apply block text-xs font-medium text-gray-700 mb-1;
}

.filter-select {
  @apply w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm;
}

.filter-toolbar { @apply flex items-center gap-2 p-2 border-b border-gray-100; }
.filter-toolbar--sticky { position: sticky; top: 0; z-index: 10; }
.toolbar-default { @apply flex items-center gap-2 w-full; }
.toolbar-search { @apply flex-1; }
.toolbar-select { @apply min-w-[140px]; }
.toolbar-actions { @apply flex items-center gap-2 ml-auto; }
.advanced-panel { @apply p-2; }
.advanced-actions { @apply flex justify-end gap-2 mt-2; }
.chips-row { @apply flex items-center justify-between p-2 border-t border-gray-100; }
.chips-presets { @apply flex items-center gap-2; }
.active-filters-label { @apply text-sm font-medium text-gray-700 mr-2; }
.filter-tags { @apply flex flex-wrap gap-2; }
.filter-tag { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200; }
.filter-tag-remove { @apply ml-2 p-0.5 rounded-full hover:bg-blue-200 transition-colors; }
.filter-bar--compact .filter-toolbar { min-height: 56px; }

/* Responsive adjustments */
@media (max-width: 768px) {
  .toolbar-default { @apply flex-wrap; }
  .toolbar-actions { @apply w-full justify-end; }
}

/* Design system overrides for dark/light mode using tokens */
.filter-bar { background: var(--ps-card); border: var(--ps-border-width) solid var(--ps-border); border-radius: var(--ps-radius-md); box-shadow: var(--ps-shadow-sm); }
.filter-label { color: var(--ps-text-secondary); }
.filter-select { background: var(--ps-card); color: var(--ps-text-primary); border: var(--ps-border-width) solid var(--ps-border); border-radius: var(--ps-radius-md); }
.filter-select:focus { border-color: var(--ps-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ps-primary) 30%, transparent); }
.chips-row { border-top: var(--ps-border-width) solid var(--ps-border); }
.active-filters-label { color: var(--ps-text-secondary); }
.filter-tag { background: color-mix(in srgb, var(--ps-primary) 15%, transparent); color: var(--ps-primary); border-color: color-mix(in srgb, var(--ps-primary) 35%, transparent); }
.filter-tag-remove:hover { background: color-mix(in srgb, var(--ps-primary) 18%, transparent); }

/* Compact padding for BaseCard content inside FilterBar */
:deep(.base-card__content) {
  padding: 0.5rem; /* más compacto */
}

/* Compact BaseInput inside FilterBar */
:deep(.base-input__label) {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

:deep(.base-input__field) {
  /* Igualar altura con .filter-select (py-1.5) */
  padding: 0.375rem 0.75rem;
  border-radius: var(--ps-radius-md);
  font-size: 0.875rem;
}
</style>
