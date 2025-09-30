<template>
  <div class="category-tree">
    <div v-if="categories.length === 0" class="text-center py-8 text-gray-500">
      No hay categorías para mostrar
    </div>
    <div v-else class="space-y-2">
      <CategoryTreeNode
        v-for="category in categories"
        :key="category.id"
        :category="category"
        :level="0"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @add-child="$emit('add-child', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
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
  categories: Category[]
}

defineProps<Props>()

defineEmits<{
  edit: [category: Category]
  delete: [category: Category]
  'add-child': [category: Category]
}>()
</script>

<script lang="ts">
import CategoryTreeNode from './CategoryTreeNode.vue'

export default {
  name: 'CategoryTree',
  components: {
    CategoryTreeNode
  }
}
</script>