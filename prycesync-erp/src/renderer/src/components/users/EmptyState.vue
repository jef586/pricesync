<template>
  <div class="p-8 text-center text-gray-600">
    <p class="mb-2">{{ message || 'No hay datos para mostrar.' }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
}
defineProps<Props>()
</script>

<style scoped></style>