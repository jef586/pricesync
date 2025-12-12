<template>
  <div class="rubro-tree-node">
    <div 
      class="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 group cursor-pointer transition-colors"
      :class="{
        'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800': isSelected,
        'hover:bg-gray-50 dark:hover:bg-slate-800': !isSelected
      }"
      :style="{ paddingLeft: `${level * 20 + 12}px` }"
      @click="onSelect"
    >
      <!-- Expand/Collapse Button -->
      <button
        v-if="hasChildren"
        @click.stop="toggleExpanded"
        class="flex-shrink-0 w-5 h-5 mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
      >
        <ChevronRightIcon 
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded }"
        />
      </button>
      <div v-else class="w-5 h-5 mr-2"></div>

      <!-- Rubro Icon -->
      <TagIcon class="w-5 h-5 text-gray-400 dark:text-gray-300 mr-3 flex-shrink-0" />

      <!-- Rubro Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {{ rubro.name }}
          </h3>
          <span 
            v-if="rubro._count?.children"
            class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {{ rubro._count.children }}
          </span>
        </div>
        <p v-if="rubro.description" class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
          {{ rubro.description }}
        </p>
      </div>

      <!-- Status Badge -->
      <div v-if="rubro.deletedAt" class="ml-2">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Eliminado
        </span>
      </div>
      <div v-else-if="!rubro.isActive" class="ml-2">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Inactivo
        </span>
      </div>
    </div>

    <!-- Children -->
    <div v-if="hasChildren && isExpanded" class="ml-2">
      <RubroTreeNode
        v-for="child in rubro.children"
        :key="child.id"
        :rubro="child"
        :level="level + 1"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
        @expand="$emit('expand', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Icons
import {
  ChevronRightIcon,
  TagIcon
} from '@heroicons/vue/24/outline'

// Components
import RubroTreeNode from './RubroTreeNode.vue'

interface RubroNode {
  id: string
  name: string
  description?: string | null
  level: number
  isActive: boolean
  deletedAt?: string | null
  children?: RubroNode[]
  _count?: {
    children: number
    articles: number
  }
}

interface Props {
  rubro: RubroNode
  level: number
  selectedId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [rubro: RubroNode | null]
  expand: [rubro: RubroNode]
}>()

// State
const isExpanded = ref(true)

// Computed
const hasChildren = computed(() => {
  return props.rubro.children && props.rubro.children.length > 0
})

const isSelected = computed(() => {
  return props.selectedId === props.rubro.id
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    emit('expand', props.rubro)
  }
}

const onSelect = () => {
  emit('select', props.rubro)
}
</script>
