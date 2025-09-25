<template>
  <div class="data-table">
    <!-- Header with search and actions -->
    <div v-if="showHeader" class="data-table__header">
      <div class="data-table__search">
        <BaseInput
          v-if="searchable"
          v-model="searchQuery"
          placeholder="Buscar..."
          type="text"
        />
      </div>
      <div class="data-table__actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Table -->
    <div class="data-table__container">
      <table class="data-table__table">
        <thead class="data-table__thead">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'data-table__th',
                {
                  'data-table__th--sortable': column.sortable,
                  'data-table__th--sorted': sortBy === column.key
                }
              ]"
              @click="handleSort(column)"
            >
              <div class="data-table__th-content">
                <span>{{ column.label }}</span>
                <div v-if="column.sortable" class="data-table__sort-icons">
                  <svg
                    :class="[
                      'data-table__sort-icon',
                      {
                        'data-table__sort-icon--active': sortBy === column.key && sortOrder === 'asc'
                      }
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg
                    :class="[
                      'data-table__sort-icon',
                      {
                        'data-table__sort-icon--active': sortBy === column.key && sortOrder === 'desc'
                      }
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </th>
            <th v-if="$slots.actions" class="data-table__th data-table__th--actions">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="data-table__tbody">
          <tr
            v-for="(item, index) in paginatedData"
            :key="getRowKey(item, index)"
            :class="[
              'data-table__tr',
              {
                'data-table__tr--clickable': clickableRows
              }
            ]"
            @click="handleRowClick(item, index)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[
                'data-table__td',
                column.class
              ]"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :value="getNestedValue(item, column.key)"
                :index="index"
              >
                {{ formatCellValue(item, column) }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="data-table__td data-table__td--actions">
              <slot name="actions" :item="item" :index="index" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="paginatedData.length === 0" class="data-table__empty">
        <slot name="empty">
          <div class="data-table__empty-content">
            <svg class="data-table__empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="data-table__empty-title">No hay datos</h3>
            <p class="data-table__empty-message">No se encontraron registros para mostrar.</p>
          </div>
        </slot>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="paginated && totalItems > pageSize" class="data-table__pagination">
      <div class="data-table__pagination-info">
        Mostrando {{ startItem }} - {{ endItem }} de {{ totalItems }} registros
      </div>
      <div class="data-table__pagination-controls">
        <BaseButton
          variant="ghost"
          size="sm"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          Anterior
        </BaseButton>
        <span class="data-table__pagination-pages">
          <button
            v-for="page in visiblePages"
            :key="page"
            :class="[
              'data-table__pagination-page',
              {
                'data-table__pagination-page--active': page === currentPage
              }
            ]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </span>
        <BaseButton
          variant="ghost"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Siguiente
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseInput from './BaseInput.vue'
import BaseButton from './BaseButton.vue'

interface Column {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any, item: any) => string
  class?: string
}

interface Props {
  data: any[]
  columns: Column[]
  searchable?: boolean
  paginated?: boolean
  pageSize?: number
  showHeader?: boolean
  clickableRows?: boolean
  rowKey?: string | ((item: any, index: number) => string)
}

interface Emits {
  (e: 'row-click', item: any, index: number): void
  (e: 'sort', column: string, order: 'asc' | 'desc'): void
}

const props = withDefaults(defineProps<Props>(), {
  searchable: true,
  paginated: true,
  pageSize: 10,
  showHeader: true,
  clickableRows: false,
  rowKey: 'id'
})

const emit = defineEmits<Emits>()

// Reactive state
const searchQuery = ref('')
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)

// Computed properties
const filteredData = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.data
  }

  const query = searchQuery.value.toLowerCase()
  return props.data.filter(item => {
    return props.columns.some(column => {
      const value = getNestedValue(item, column.key)
      return String(value).toLowerCase().includes(query)
    })
  })
})

const sortedData = computed(() => {
  if (!sortBy.value) {
    return filteredData.value
  }

  return [...filteredData.value].sort((a, b) => {
    const aValue = getNestedValue(a, sortBy.value)
    const bValue = getNestedValue(b, sortBy.value)

    let comparison = 0
    if (aValue > bValue) comparison = 1
    if (aValue < bValue) comparison = -1

    return sortOrder.value === 'desc' ? -comparison : comparison
  })
})

const totalItems = computed(() => sortedData.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / props.pageSize))

const paginatedData = computed(() => {
  if (!props.paginated) {
    return sortedData.value
  }

  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return sortedData.value.slice(start, end)
})

const startItem = computed(() => {
  if (totalItems.value === 0) return 0
  return (currentPage.value - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  const end = currentPage.value * props.pageSize
  return Math.min(end, totalItems.value)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Methods
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const getRowKey = (item: any, index: number) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item, index)
  }
  return getNestedValue(item, props.rowKey) || index
}

const formatCellValue = (item: any, column: Column) => {
  const value = getNestedValue(item, column.key)
  
  if (column.formatter) {
    return column.formatter(value, item)
  }
  
  return value ?? ''
}

const handleSort = (column: Column) => {
  if (!column.sortable) return

  if (sortBy.value === column.key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column.key
    sortOrder.value = 'asc'
  }

  emit('sort', column.key, sortOrder.value)
}

const handleRowClick = (item: any, index: number) => {
  if (props.clickableRows) {
    emit('row-click', item, index)
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Watch for data changes to reset pagination
watch(() => props.data, () => {
  currentPage.value = 1
})

watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.data-table {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
}

.data-table__header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50;
}

.data-table__search {
  @apply flex-1 max-w-md;
}

.data-table__actions {
  @apply flex items-center gap-2;
}

.data-table__container {
  @apply overflow-x-auto;
}

.data-table__table {
  @apply w-full;
}

.data-table__thead {
  @apply bg-gray-50;
}

.data-table__th {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200;
}

.data-table__th--sortable {
  @apply cursor-pointer hover:bg-gray-100 transition-colors duration-200;
}

.data-table__th--actions {
  @apply text-center;
}

.data-table__th-content {
  @apply flex items-center justify-between;
}

.data-table__sort-icons {
  @apply flex flex-col ml-2;
}

.data-table__sort-icon {
  @apply w-3 h-3 text-gray-400 transition-colors duration-200;
}

.data-table__sort-icon--active {
  @apply text-gray-700;
}

.data-table__tbody {
  @apply bg-white divide-y divide-gray-200;
}

.data-table__tr {
  @apply hover:bg-gray-50 transition-colors duration-200;
}

.data-table__tr--clickable {
  @apply cursor-pointer;
}

.data-table__td {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
}

.data-table__td--actions {
  @apply text-center;
}

.data-table__empty {
  @apply p-12;
}

.data-table__empty-content {
  @apply text-center;
}

.data-table__empty-icon {
  @apply w-12 h-12 mx-auto text-gray-400 mb-4;
}

.data-table__empty-title {
  @apply text-lg font-medium text-gray-900 mb-2;
}

.data-table__empty-message {
  @apply text-gray-500;
}

.data-table__pagination {
  @apply flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50;
}

.data-table__pagination-info {
  @apply text-sm text-gray-700;
}

.data-table__pagination-controls {
  @apply flex items-center gap-2;
}

.data-table__pagination-pages {
  @apply flex items-center gap-1;
}

.data-table__pagination-page {
  @apply px-3 py-1 text-sm rounded-md transition-colors duration-200 hover:bg-gray-200;
}

.data-table__pagination-page--active {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
</style>