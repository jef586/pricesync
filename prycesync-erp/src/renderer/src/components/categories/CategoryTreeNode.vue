<template>
  <div class="category-tree-node">
    <div 
      class="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 group"
      :style="{ paddingLeft: `${level * 24 + 12}px` }"
    >
      <!-- Expand/Collapse Button -->
      <button
        v-if="hasChildren"
        @click="toggleExpanded"
        class="flex-shrink-0 w-5 h-5 mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <ChevronRightIcon 
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded }"
        />
      </button>
      <div v-else class="w-5 h-5 mr-2"></div>

      <!-- Category Icon -->
      <TagIcon class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />

      <!-- Category Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center">
          <h3 class="text-sm font-medium text-gray-900 truncate">
            {{ category.name }}
          </h3>
          <span 
            v-if="category._count?.products"
            class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {{ category._count.products }}
          </span>
        </div>
        <p v-if="category.description" class="text-xs text-gray-500 truncate mt-1">
          {{ category.description }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <BaseButton
          variant="ghost"
          size="sm"
          @click="$emit('add-child', category)"
          title="Agregar subcategoría"
        >
          <PlusIcon class="w-4 h-4" />
        </BaseButton>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="$emit('edit', category)"
          title="Editar categoría"
        >
          <PencilIcon class="w-4 h-4" />
        </BaseButton>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="$emit('delete', category)"
          :disabled="(category._count?.products || 0) > 0 || hasChildren"
          title="Eliminar categoría"
        >
          <TrashIcon class="w-4 h-4" />
        </BaseButton>
      </div>
    </div>

    <!-- Children -->
    <div v-if="hasChildren && isExpanded" class="ml-2">
      <CategoryTreeNode
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :level="level + 1"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @add-child="$emit('add-child', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Icons
import {
  ChevronRightIcon,
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

// Components
import BaseButton from '@/components/atoms/BaseButton.vue'

interface Category {
  id: string
  name: string
  description?: string
  children?: Category[]
  _count?: {
    products: number
  }
  createdAt: string
}

interface Props {
  category: Category
  level: number
}

const props = defineProps<Props>()

defineEmits<{
  edit: [category: Category]
  delete: [category: Category]
  'add-child': [category: Category]
}>()

// State
const isExpanded = ref(true)

// Computed
const hasChildren = computed(() => {
  return props.category.children && props.category.children.length > 0
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>