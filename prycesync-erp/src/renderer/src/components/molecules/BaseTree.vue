<template>
  <div class="base-tree">
    <div v-if="nodes.length === 0" class="base-tree__empty">No hay datos</div>
    <div v-else class="space-y-1">
      <TreeNode
        v-for="n in nodes"
        :key="n.id"
        :node="n"
        :level="0"
        @expand="$emit('expand', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TreeNode from './BaseTreeNode.vue'
interface Props { nodes: any[] }
defineProps<Props>()
defineEmits<{ expand: [node: any]; select: [node: any] }>()
</script>

<style scoped>
.base-tree { background: var(--ps-card); border: var(--ps-border-width) solid var(--ps-border); border-radius: var(--ps-radius-lg); }
.base-tree__empty { padding: 1rem; color: var(--ps-text-secondary); text-align: center; }
</style>
