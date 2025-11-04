<template>
  <div class="p-4 bg-red-50 text-red-700" role="alert">
    <div class="flex items-center justify-between">
      <span>{{ message || 'Ocurrió un error.' }}</span>
      <BaseButton variant="secondary" @click="$emit('retry')">Reintentar</BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/components/atoms/BaseButton.vue'

interface Props {
  message?: string
}
defineProps<Props>()
</script>

<style scoped></style>