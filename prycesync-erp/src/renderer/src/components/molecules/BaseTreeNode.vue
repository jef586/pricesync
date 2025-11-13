<template>
  <div class="base-tree-node">
    <div class="base-tree-node__row" :style="{ paddingLeft: `${level * 20 + 12}px` }" @click="emit('select', node)">
      <button v-if="hasChildrenHint" class="base-tree-node__toggle" @click.stop="toggle">
        <ChevronRightIcon class="w-4 h-4" :class="{ 'rotate-90': expanded }" />
      </button>
      <div v-else class="w-4 h-4 mr-1"></div>
      <component :is="statusIcon" class="w-5 h-5 base-tree-node__icon" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="base-tree-node__name">{{ node.name }}</span>
          <BaseBadge v-if="node._count?.children" variant="neutral">{{ node._count?.children }}</BaseBadge>
        </div>
        <p v-if="node.description" class="base-tree-node__desc">{{ node.description }}</p>
      </div>
    </div>
    <div v-if="expanded" class="ml-2">
      <div v-if="node.loading" class="p-2"><BaseSpinner size="sm" /></div>
      <TreeNode
        v-for="c in node.children"
        :key="c.id"
        :node="c"
        :level="level + 1"
        @expand="emit('expand', $event)"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import BaseSpinner from '@/components/atoms/BaseSpinner.vue'
import { ChevronRightIcon, XCircleIcon, CheckCircleIcon, TrashIcon } from '@heroicons/vue/24/outline'

interface Props { node: any; level: number }
const props = defineProps<Props>()
const emit = defineEmits<{ expand: [node: any]; select: [node: any] }>()

const expanded = ref(true)
const hasChildrenHint = computed(() => (props.node._count?.children || 0) > 0 || (props.node.children?.length || 0) > 0)

const statusIcon = computed(() => {
  if (props.node.deletedAt) return TrashIcon
  return props.node.isActive ? CheckCircleIcon : XCircleIcon
})

const toggle = () => {
  if (!expanded.value) {
    if (!props.node.loaded) emit('expand', props.node)
  }
  expanded.value = !expanded.value
}
</script>

<script lang="ts">
export default { name: 'TreeNode' }
</script>

<style scoped>
.base-tree-node__row { display:flex; align-items:center; gap:.5rem; padding:.5rem .5rem; border-radius:.5rem; cursor:pointer; }
.base-tree-node__row:hover { background: color-mix(in srgb, var(--ps-bg) 8%, transparent); }
.base-tree-node__toggle { width:1.25rem; height:1.25rem; display:flex; align-items:center; justify-content:center; color: var(--ps-text-secondary); }
.base-tree-node__icon { color: var(--ps-text-secondary); margin-right:.25rem; }
.base-tree-node__name { font-size:.875rem; font-weight:600; color: var(--ps-text-primary); }
.base-tree-node__desc { font-size:.75rem; color: var(--ps-text-secondary); }
</style>
