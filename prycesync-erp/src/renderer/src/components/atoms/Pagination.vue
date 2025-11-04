<template>
  <div class="pagination">
<div class="pagination-info" aria-live="polite">
      <span class="text-sm text-gray-700">
        Mostrando {{ startItem }} a {{ endItem }} de {{ totalItems }} resultados
      </span>
    </div>
    
    <div class="pagination-controls">
      <BaseButton
        variant="outline"
        size="sm"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
        class="pagination-button"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Anterior
      </BaseButton>
      
      <div class="pagination-pages">
        <BaseButton
          v-for="page in visiblePages"
          :key="page"
          :variant="page === currentPage ? 'primary' : 'ghost'"
          size="sm"
          @click="goToPage(page)"
          class="pagination-page"
        >
          {{ page }}
        </BaseButton>
      </div>
      
      <BaseButton
        variant="outline"
        size="sm"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
        class="pagination-button"
      >
        Siguiente
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 5
})

const emit = defineEmits<{
  pageChange: [page: number]
}>()

// Computed properties
const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const half = Math.floor(props.maxVisiblePages / 2)
  
  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(props.totalPages, start + props.maxVisiblePages - 1)
  
  // Adjust start if we're near the end
  if (end - start + 1 < props.maxVisiblePages) {
    start = Math.max(1, end - props.maxVisiblePages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('pageChange', page)
  }
}
</script>

<style scoped>
.pagination {
  @apply flex items-center justify-between;
}

.pagination-info {
  @apply flex-shrink-0;
}

.pagination-controls {
  @apply flex items-center space-x-2;
}

.pagination-pages {
  @apply flex items-center space-x-1;
}

.pagination-button {
  @apply flex items-center space-x-1;
}

.pagination-page {
  @apply min-w-[2.5rem] justify-center;
}

@media (max-width: 640px) {
  .pagination {
    @apply flex-col space-y-4;
  }
  
  .pagination-controls {
    @apply w-full justify-center;
  }
}
</style>
