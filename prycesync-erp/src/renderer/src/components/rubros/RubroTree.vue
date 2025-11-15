<template>
  <div class="rubro-tree">
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    <div v-else-if="tree.length === 0" class="text-center py-8 text-gray-500">
      No hay rubros para mostrar
    </div>
    <div v-else class="space-y-1">
      <RubroTreeNode
        v-for="rubro in tree"
        :key="rubro.id"
        :rubro="rubro"
        :level="0"
        :selected-id="selectedNodeId"
        @select="onSelectRubro"
        @expand="onExpandRubro"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRubrosStore } from '@/stores/rubros'
import RubroTreeNode from './RubroTreeNode.vue'
import type { RubroNode } from '@/types/rubro'

const store = useRubrosStore()

const props = defineProps<{
  selectedNodeId?: string | null
}>()

const emit = defineEmits<{
  select: [rubro: RubroNode | null]
}>()

const loading = computed(() => store.loading)
const tree = computed(() => store.tree)
const selectedNodeId = computed(() => props.selectedNodeId)

onMounted(async () => {
  await store.fetchTree()
})

const onSelectRubro = async (rubro: RubroNode | null) => {
  emit('select', rubro)
  
  // If selecting a rubro, fetch its children for the listing
  if (rubro) {
    await store.fetchList({ parentId: rubro.id })
  } else {
    // If selecting root, fetch all root level rubros
    await store.fetchList({ parentId: null })
  }
}

const onExpandRubro = async (rubro: RubroNode) => {
  if (!rubro.loaded && !rubro.loading) {
    await store.expandNode(rubro.id)
  }
}
</script>