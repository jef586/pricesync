<template>
  <div class="h-full flex flex-col dark:bg-slate-900">
    <header class="px-4 py-3 border-b dark:border-slate-700 flex items-center justify-between">
      <h2 class="text-lg font-semibold dark:text-slate-100">Chat IA — Inventario</h2>
      <div class="text-xs text-slate-500 dark:text-slate-400">Proveedor: {{ providerLabel }}</div>
    </header>

    <main class="flex-1 overflow-y-auto">
      <ChatWindow />
    </main>

    <section class="border-t dark:border-slate-700">
      <ChatInput />
      <div class="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
        Sugerencias:
        <button class="px-2 py-1 hover:underline" @click="ask('Stock del alternador Bosch 12V?')">Stock del alternador Bosch 12V?</button>
        <button class="px-2 py-1 hover:underline" @click="ask('Precio del filtro de aceite Mann?')">Precio del filtro de aceite Mann?</button>
        <button class="px-2 py-1 hover:underline" @click="ask('Productos de la categoría Frenos')">Productos de la categoría Frenos</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '../../stores/modules/auto-parts/chat'
import ChatWindow from './ChatWindow.vue'
import ChatInput from './ChatInput.vue'

const store = useChatStore()
store.init()

const providerLabel = computed(() => (import.meta.env.VITE_AI_PROVIDER || 'openai').toUpperCase())
function ask(text: string) {
  store.sendMessage(text)
}
</script>