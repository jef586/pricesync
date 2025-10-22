<template>
  <div class="flex items-center gap-2 px-4 py-3">
    <input
      v-model="text"
      type="text"
      placeholder="Escribe tu consulta (stock, precio, categoría)"
      class="flex-1 px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
      @keydown.enter.prevent="send"
    />
    <button
      class="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      :disabled="isLoading || !text.trim()"
      @click="send"
    >Enviar</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '../../stores/modules/auto-parts/chat'

const store = useChatStore()
const text = ref('')
const isLoading = computed(() => store.isLoading)

function send() {
  const val = text.value.trim()
  if (!val) return
  store.sendMessage(val)
  text.value = ''
}
</script>