<template>
  <div class="px-4 py-3 space-y-3">
    <div v-for="m in messages" :key="m.id">
      <ChatMessage :message="m" />
    </div>
    <div v-if="isLoading" class="pl-8">
      <ChatTyping />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '../../stores/modules/auto-parts/chat'
import ChatMessage from './ChatMessage.vue'
import ChatTyping from './ChatTyping.vue'

const store = useChatStore()
const messages = computed(() => store.messages)
const isLoading = computed(() => store.isLoading)
</script>