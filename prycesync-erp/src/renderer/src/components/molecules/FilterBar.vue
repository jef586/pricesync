<template>
  <BaseCard class="filter-bar">
    <div class="filter-bar-header">
      <h3 class="filter-title">Filtros</h3>
      <BaseButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        @click="clearAllFilters"
        class="clear-filters-btn"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Limpiar Todo
      </BaseButton>
    </div>

    <div class="filter-grid">
      <!-- Search Filter -->
      <div v-if="showSearch" class="filter-item search-filter">
        <BaseInput
          :model-value="modelValue.search || ''"
          :placeholder="searchPlaceholder"
          @update:model-value="updateFilter('search', $event)"
          @input="handleSearchInput"
        >
          <template #prefix>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </template>
        </BaseInput>
      </div>

      <!-- Status Filter -->
      <div v-if="statusOptions.length > 0" class="filter-item">
        <label class="filter-label">Estado</label>
        <select
          :value="modelValue.status || ''"
          @change="updateFilter('status', $event.target.value)"
          class="filter-select"
        >
          <option value="">Todos los estados</option>
          <option
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Type Filter -->
      <div v-if="typeOptions.length > 0" class="filter-item">
        <label class="filter-label">Tipo</label>
        <select
          :value="modelValue.type || ''"
          @change="updateFilter('type', $event.target.value)"
          class="filter-select"
        >
          <option value="">Todos los tipos</option>
          <option
            v-for="option in typeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Date Range Filters -->
      <div v-if="showDateRange" class="filter-item date-range">
        <label class="filter-label">Rango de Fechas</label>
        <div class="date-inputs">
          <BaseInput
            :model-value="modelValue.dateFrom || ''"
            type="date"
            placeholder="Desde"
            @update:model-value="updateFilter('dateFrom', $event)"
            class="date-input"
          />
          <span class="date-separator">-</span>
          <BaseInput
            :model-value="modelValue.dateTo || ''"
            type="date"
            placeholder="Hasta"
            @update:model-value="updateFilter('dateTo', $event)"
            class="date-input"
          />
        </div>
      </div>

      <!-- Custom Filters Slot -->
      <slot name="custom-filters" :update-filter="updateFilter" />
    </div>

    <!-- Active Filters Display -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="active-filters-label">Filtros activos:</span>
      <div class="filter-tags">
        <span
          v-for="filter in activeFiltersList"
          :key="filter.key"
          class="filter-tag"
        >
          {{ filter.label }}: {{ filter.value }}
          <button
            @click="clearFilter(filter.key)"
            class="filter-tag-remove"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
  showSearch?: boolean
  showDateRange?: boolean
  searchPlaceholder?: string
  debounceMs?: number
}

interface Emits {
  (e: 'update:modelValue', value: FilterValues): void
  (e: 'filter-change', filters: FilterValues): void
  (e: 'search', query: string): void
}

const props = withDefaults(defineProps<Props>(), {
  statusOptions: () => [],
  typeOptions: () => [],
  showSearch: true,
  showDateRange: true,
  searchPlaceholder: 'Buscar...',
  debounceMs: 300
})

const emit = defineEmits<Emits>()

let searchTimeout: NodeJS.Timeout | null = null

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

const clearFilter = (key: string) => {
  const newFilters = { ...props.modelValue }
  delete newFilters[key]
  emit('update:modelValue', newFilters)
  emit('filter-change', newFilters)
}

const clearAllFilters = () => {
  emit('update:modelValue', {})
  emit('filter-change', {})
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
</script>

<style scoped>
.filter-bar {
  @apply bg-white border border-gray-200 rounded-md shadow-sm;
}

.filter-bar-header {
  @apply flex items-center justify-between mb-3 pb-2 border-b border-gray-100;
}

.filter-title {
  @apply text-base font-semibold text-gray-900;
}

.clear-filters-btn {
  @apply text-gray-500 hover:text-gray-700;
}

.filter-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-3;
}

.filter-item {
  @apply space-y-2;
}

.search-filter {
  @apply md:col-span-2;
}

.filter-label {
  @apply block text-xs font-medium text-gray-700 mb-1;
}

.filter-select {
  @apply w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm;
}

.date-range {
  @apply lg:col-span-2;
}

.date-inputs {
  @apply flex items-center space-x-2;
}

.date-input {
  @apply flex-1;
}

.date-separator {
  @apply text-gray-400 font-medium;
}

.active-filters {
  @apply pt-3 border-t border-gray-100;
}

.active-filters-label {
  @apply text-sm font-medium text-gray-700 mb-2 block;
}

.filter-tags {
  @apply flex flex-wrap gap-2;
}

.filter-tag {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200;
}

.filter-tag-remove {
  @apply ml-2 p-0.5 rounded-full hover:bg-blue-200 transition-colors;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filter-grid {
    @apply grid-cols-1 gap-2;
  }
  
  .search-filter,
  .date-range {
    @apply col-span-1;
  }
  
  .date-inputs {
    @apply flex-col space-x-0 space-y-2;
  }
  
  .date-separator {
    @apply hidden;
  }
}

/* Design system overrides for dark/light mode using tokens */
.filter-bar { background: var(--ps-card); border: var(--ps-border-width) solid var(--ps-border); border-radius: var(--ps-radius-md); box-shadow: var(--ps-shadow-sm); }
.filter-bar-header { border-bottom: var(--ps-border-width) solid var(--ps-border); }
.filter-title { color: var(--ps-text-primary); }
.clear-filters-btn { color: var(--ps-text-secondary); }
.clear-filters-btn:hover { color: var(--ps-text-primary); }
.filter-label { color: var(--ps-text-secondary); }
.filter-select { background: var(--ps-card); color: var(--ps-text-primary); border: var(--ps-border-width) solid var(--ps-border); border-radius: var(--ps-radius-md); }
.filter-select:focus { border-color: var(--ps-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ps-primary) 30%, transparent); }
.date-separator { color: var(--ps-text-secondary); }
.active-filters { border-top: var(--ps-border-width) solid var(--ps-border); }
.active-filters-label { color: var(--ps-text-secondary); }
.filter-tag { background: color-mix(in srgb, var(--ps-primary) 15%, transparent); color: var(--ps-primary); border-color: color-mix(in srgb, var(--ps-primary) 35%, transparent); }
.filter-tag-remove:hover { background: color-mix(in srgb, var(--ps-primary) 18%, transparent); }

/* Compact padding for BaseCard content inside FilterBar */
:deep(.base-card__content) {
  padding: 0.75rem;
}

/* Compact BaseInput inside FilterBar */
:deep(.base-input__label) {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

:deep(.base-input__field) {
  padding: 0.5rem 0.75rem;
  border-radius: var(--ps-radius-md);
  font-size: 0.875rem;
}
</style>