<template>
  <div :class="wrapperClass">
    <div :class="bubbleClass">
      <p class="text-sm whitespace-pre-line" v-text="message.text" />
      <div v-if="message.payload?.type === 'table' && Array.isArray(message.payload?.data)" class="mt-2">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-slate-500 dark:text-slate-400">
              <th class="text-left">Artículo</th>
              <th class="text-left">SKU</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in message.payload.data" :key="row.id" class="border-t dark:border-slate-700">
              <td class="py-1">{{ row.name }}</td>
              <td class="py-1">{{ row.sku || '-' }}</td>
              <td class="py-1 text-right">{{ row.pricePublic ?? '-' }}</td>
              <td class="py-1 text-right">{{ row.stockOnHand ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage as Msg } from '../../stores/modules/auto-parts/chat'

const props = defineProps<{ message: Msg }>()

const wrapperClass = computed(() => {
  return props.message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
})

const bubbleClass = computed(() => {
  return props.message.role === 'user'
    ? 'inline-block max-w-[80%] bg-blue-600 text-white px-3 py-2 rounded-lg shadow-sm'
    : 'inline-block max-w-[80%] bg-slate-100 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 rounded-lg shadow-sm'
})
</script>