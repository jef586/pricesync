<template>
  <div class="form-field">
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span v-if="label" class="text-sm text-gray-700">{{ label }}</span>
    </label>
    <p v-if="help" class="mt-1 text-xs text-gray-500">{{ help }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label?: string
  help?: string
}>()
defineEmits(['update:modelValue'])
</script>

<style scoped>
.form-field { display: block; }
</style>