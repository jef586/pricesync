<template>
  <BaseModal v-model="visible" title="Vista previa del ticket" size="xl" @close="onClose">
    <div class="preview-container">
      <div v-if="loading" class="preview-loading" role="status" aria-live="polite">
        <div class="spinner"></div>
        <p>Cargando vista previa…</p>
      </div>
      <div v-else-if="error" class="preview-error">
        <p class="text-red-600">{{ error }}</p>
      </div>
      <div v-else class="preview-content">
        <!-- Use iframe to render complete HTML safely -->
        <iframe :srcdoc="html" class="preview-iframe" title="Ticket Preview"></iframe>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="ghost" @click="onClose">Cerrar</BaseButton>
      </div>
    </template>
  </BaseModal>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '@/components/atoms/BaseModal.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

interface Props {
  modelValue: boolean
  html: string
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

function onClose() { emit('update:modelValue', false); emit('close') }
</script>

<style scoped>
.preview-container { @apply min-h-[300px]; }
.preview-loading { @apply flex flex-col items-center justify-center gap-3 py-8; }
.spinner { @apply w-8 h-8 rounded-full border-4 border-gray-300 border-t-blue-500 animate-spin; }
.preview-content { @apply overflow-auto max-h-[70vh]; }
.preview-iframe { @apply w-full h-[70vh] border rounded-md; background: var(--ps-card); }
</style>